# Student Portal (Flask)

Student and admin portal for eLearning Group Institute. Flask + SQLite, one container, no external database.
The frontend in `public/` is plain HTML, CSS and JavaScript and talks to the Flask JSON API under `/api`.

- **Admin login:** one administrator password from the environment. Admins add and edit students, enter grades, reset access codes and post announcements.
- **Student login:** Student ID plus a one-time access code issued by the admin. Students see only their own results, GPA and announcements.
- **Security built in:** hashed access codes (Werkzeug scrypt), signed HttpOnly SameSite=Strict session cookies (8 hours), login rate limiting (Flask-Limiter), strict Content-Security-Policy and security headers (Flask-Talisman), same-origin check on writes, server-side validation, non-root container.

## 1. Configure

    cp .env.example .env

Fill in `SESSION_SECRET` (32+ characters), `ADMIN_PASSWORD` (10+ characters) and `DOMAIN`. The app refuses to start without the first two.

## 2. Run locally

    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements-dev.txt
    export SESSION_SECRET=$(python -c "import secrets; print(secrets.token_hex(32))")
    export ADMIN_PASSWORD='choose-a-long-password' APP_ENV=development
    python app.py          # http://127.0.0.1:8000
    pytest                 # run the API tests

## 3. Deploy

### Option A: Docker with automatic HTTPS (recommended)
Point your domain's DNS A record at your server, then:

    docker compose up -d --build

Caddy gets and renews the HTTPS certificate automatically. Open `https://YOUR_DOMAIN`.

### Option B: gunicorn directly

    pip install -r requirements.txt
    export $(grep -v '^#' .env | xargs)
    gunicorn -w 1 --threads 8 -b 127.0.0.1:8000 app:app

Put it behind an HTTPS reverse proxy (Caddy, nginx) and keep it alive with systemd. Use one worker with threads so the login rate limiter stays accurate.

### Option C: Render, Railway or Fly.io
Deploy the Dockerfile, set `SESSION_SECRET` and `ADMIN_PASSWORD`, and attach a **persistent volume mounted at `/app/data`**. Without it the database is lost on every redeploy.

## 4. First use
1. Open the site, choose **Admin login**, sign in with `ADMIN_PASSWORD`.
2. Click **Add student**. The access code appears once. Give it to the student.
3. Students use **Student login** with their Student ID and code.

## Operations
- **Backup:** the database is one file. `docker compose exec app python -c "import sqlite3; s=sqlite3.connect('/app/data/portal.db'); s.backup(sqlite3.connect('/app/data/backup.db'))"`, then copy `backup.db` off the server. Do this regularly.
- **Health check:** `GET /healthz`.
- **Rotate the admin password:** change `ADMIN_PASSWORD` and restart. Change `SESSION_SECRET` to sign everyone out.
- **Course list:** edit `SEMS` at the top of `public/app.js`, then redeploy.
- **Logo and colours:** replace `public/logo.jpg`; colours are variables at the top of `public/styles.css`.

## Layout

    app.py             Flask app: auth, API, SQLite
    public/            index.html, app.js, styles.css, logo.jpg (unchanged frontend)
    tests/             API tests
    Dockerfile  docker-compose.yml  Caddyfile  .env.example  requirements*.txt
