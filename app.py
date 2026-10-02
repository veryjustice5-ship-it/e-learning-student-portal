"""Student portal backend (Flask + SQLite). Serves the static frontend in ./public and a JSON API under /api."""
import hashlib
import json
import os
import re
import secrets
import sqlite3
import time
from datetime import timedelta
from functools import wraps

from flask import Flask, g, jsonify, request, send_from_directory, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash

BASE = os.path.dirname(os.path.abspath(__file__))
SECRET = os.environ.get("SESSION_SECRET", "")
ADMIN_PW = os.environ.get("ADMIN_PASSWORD", "")
DB_PATH = os.environ.get("DB_PATH", os.path.join(BASE, "data", "portal.db"))
PROD = os.environ.get("APP_ENV", "production") == "production"

if len(SECRET) < 32 or len(ADMIN_PW) < 10:
    raise RuntimeError("Set SESSION_SECRET (32+ characters) and ADMIN_PASSWORD (10+ characters) in the environment.")

app = Flask(__name__, static_folder=os.path.join(BASE, "public"), static_url_path="")
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
app.config.update(
    SECRET_KEY=SECRET,
    SESSION_COOKIE_NAME="portal_session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Strict",
    SESSION_COOKIE_SECURE=PROD,
    PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
    MAX_CONTENT_LENGTH=100 * 1024,
    SEND_FILE_MAX_AGE_DEFAULT=timedelta(hours=1),
    JSON_SORT_KEYS=False,
)

Talisman(
    app,
    force_https=False,  # HTTPS redirect is handled by the reverse proxy (Caddy)
    strict_transport_security=PROD,
    frame_options="DENY",
    referrer_policy="same-origin",
    session_cookie_secure=PROD,
    session_cookie_http_only=True,
    session_cookie_samesite="Strict",
    content_security_policy={
        "default-src": "'self'",
        "script-src": "'self'",
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": "https://fonts.gstatic.com",
        "img-src": ["'self'", "data:"],
        "connect-src": "'self'",
        "object-src": "'none'",
        "frame-ancestors": "'none'",
    },
)
limiter = Limiter(get_remote_address, app=app, default_limits=[], storage_uri="memory://")
LOGIN_LIMIT = os.environ.get("LOGIN_LIMIT", "10 per 15 minutes")

ADMIN_HASH = generate_password_hash(ADMIN_PW)
DUMMY_HASH = generate_password_hash("not-a-real-code")
GRADES = {"A", "A-", "B+", "B", "C+", "C", "D", "F"}

SCHEMA = """
CREATE TABLE IF NOT EXISTS students(
  sid TEXT PRIMARY KEY, student_id TEXT NOT NULL, name TEXT NOT NULL,
  prog TEXT NOT NULL DEFAULT '', dept TEXT NOT NULL DEFAULT '', level TEXT NOT NULL DEFAULT '', year TEXT NOT NULL DEFAULT '',
  grades TEXT NOT NULL DEFAULT '{}', code_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS announcements(
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL);
"""


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA journal_mode=WAL")
    con.executescript(SCHEMA)
    con.commit()
    con.close()


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exc):
    con = g.pop("db", None)
    if con is not None:
        con.close()


init_db()


# ---------- helpers ----------
def err(message, status):
    return jsonify(error=message), status


def sid_of(student_id):
    return re.sub(r"[^A-Z0-9]", "_", str(student_id).strip().upper())


def mkcode():
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(10))


def text(value, limit):
    return ("" if value is None else str(value)).strip()[:limit]


def clean_profile(p):
    p = p if isinstance(p, dict) else {}
    return {"id": text(p.get("id"), 60), "name": text(p.get("name"), 120), "prog": text(p.get("prog"), 120),
            "dept": text(p.get("dept"), 120), "level": text(p.get("level"), 20), "year": text(p.get("year"), 20)}


def clean_grades(g_):
    if not isinstance(g_, dict):
        return {}
    return {k: v for k, v in g_.items() if isinstance(k, str) and re.fullmatch(r"[A-Z]{3} \d{3}", k) and v in GRADES}


def pub(row):
    return {"sid": row["sid"], "id": row["student_id"], "name": row["name"], "prog": row["prog"], "dept": row["dept"],
            "level": row["level"], "year": row["year"], "grades": json.loads(row["grades"])}


def tag(code_hash):
    return hashlib.sha256(code_hash.encode()).hexdigest()[:12]


def body():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def need(role=None):
    def deco(fn):
        @wraps(fn)
        def wrapper(*a, **k):
            if not session.get("role") or (role and session["role"] != role):
                return err("Session expired. Please sign in again.", 401)
            return fn(*a, **k)
        return wrapper
    return deco


# ---------- request hooks ----------
@app.before_request
def same_origin_only():
    if request.path.startswith("/api/") and request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("Origin")
        if origin and origin.split("://", 1)[-1] != request.host:
            return err("Cross-origin request blocked.", 403)


@app.after_request
def no_store(resp):
    if request.path.startswith("/api/"):
        resp.headers["Cache-Control"] = "no-store"
    return resp


@app.errorhandler(HTTPException)
def http_error(e):
    if request.path.startswith("/api/"):
        msg = "Too many attempts. Try again in 15 minutes." if e.code == 429 else (e.description if e.code < 500 else "Server error.")
        return err(msg, e.code)
    return e


# ---------- pages ----------
@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/healthz")
def healthz():
    return jsonify(ok=True)


# ---------- auth ----------
@app.post("/api/admin/login")
@limiter.limit(LOGIN_LIMIT)
def admin_login():
    if not check_password_hash(ADMIN_HASH, str(body().get("password", ""))):
        return err("Incorrect admin password.", 401)
    session.clear()
    session.permanent = True
    session["role"] = "admin"
    return jsonify(ok=True)


@app.post("/api/student/login")
@limiter.limit(LOGIN_LIMIT)
def student_login():
    d = body()
    row = db().execute("SELECT * FROM students WHERE sid=?", (sid_of(d.get("id", "")),)).fetchone()
    code = str(d.get("code", "")).strip().upper()
    valid = check_password_hash(row["code_hash"] if row else DUMMY_HASH, code)
    if not row or not valid:
        return err("Student ID or access code is not correct.", 401)
    session.clear()
    session.permanent = True
    session.update(role="student", sid=row["sid"], h=tag(row["code_hash"]))
    return jsonify(ok=True)


@app.get("/api/me")
def me():
    return jsonify(role=session.get("role"), sid=session.get("sid"))


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


# ---------- student ----------
@app.get("/api/student")
@need("student")
def student_self():
    row = db().execute("SELECT * FROM students WHERE sid=?", (session.get("sid"),)).fetchone()
    if not row or tag(row["code_hash"]) != session.get("h"):
        session.clear()
        return err("Session expired. Please sign in again.", 401)
    return jsonify(student=pub(row))


@app.get("/api/announcements")
@need()
def announcements():
    rows = db().execute("SELECT id, title, body, ts FROM announcements ORDER BY ts DESC LIMIT 100").fetchall()
    return jsonify(items=[dict(r) for r in rows])


# ---------- admin: students ----------
@app.get("/api/students")
@need("admin")
def students_list():
    rows = db().execute("SELECT * FROM students ORDER BY name").fetchall()
    return jsonify(students=[pub(r) for r in rows])


@app.post("/api/students")
@need("admin")
def students_create():
    d = body()
    p = clean_profile(d.get("profile"))
    if not p["name"] or not p["id"]:
        return err("Name and student ID are required.", 400)
    sid = sid_of(p["id"])
    if db().execute("SELECT 1 FROM students WHERE sid=?", (sid,)).fetchone():
        return err("That student ID already exists.", 409)
    code = mkcode()
    db().execute(
        "INSERT INTO students(sid,student_id,name,prog,dept,level,year,grades,code_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
        (sid, p["id"], p["name"], p["prog"], p["dept"], p["level"], p["year"],
         json.dumps(clean_grades(d.get("grades"))), generate_password_hash(code), int(time.time() * 1000)))
    db().commit()
    return jsonify(sid=sid, code=code), 201


@app.put("/api/students/<sid>")
@need("admin")
def students_update(sid):
    d = body()
    p = clean_profile(d.get("profile"))
    if not p["name"]:
        return err("Name is required.", 400)
    cur = db().execute("UPDATE students SET name=?, prog=?, dept=?, level=?, year=?, grades=? WHERE sid=?",
                       (p["name"], p["prog"], p["dept"], p["level"], p["year"], json.dumps(clean_grades(d.get("grades"))), sid))
    db().commit()
    return jsonify(ok=True) if cur.rowcount else err("Student not found.", 404)


@app.post("/api/students/<sid>/code")
@need("admin")
def students_new_code(sid):
    code = mkcode()
    cur = db().execute("UPDATE students SET code_hash=? WHERE sid=?", (generate_password_hash(code), sid))
    db().commit()
    return jsonify(code=code) if cur.rowcount else err("Student not found.", 404)


@app.delete("/api/students/<sid>")
@need("admin")
def students_delete(sid):
    db().execute("DELETE FROM students WHERE sid=?", (sid,))
    db().commit()
    return jsonify(ok=True)


# ---------- admin: announcements ----------
@app.post("/api/announcements")
@need("admin")
def announcements_create():
    d = body()
    title = text(d.get("title"), 200)
    if not title:
        return err("Title is required.", 400)
    db().execute("INSERT INTO announcements(title, body, ts) VALUES(?,?,?)", (title, text(d.get("body"), 2000), int(time.time() * 1000)))
    db().commit()
    return jsonify(ok=True), 201


@app.delete("/api/announcements/<int:ann_id>")
@need("admin")
def announcements_delete(ann_id):
    db().execute("DELETE FROM announcements WHERE id=?", (ann_id,))
    db().commit()
    return jsonify(ok=True)


if __name__ == "__main__":  # local development only; production uses gunicorn
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 8000)), debug=False)
