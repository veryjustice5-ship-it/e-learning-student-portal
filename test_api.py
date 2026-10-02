import importlib, os, sys, tempfile
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture()
def client():
    os.environ.update(SESSION_SECRET="s" * 40, ADMIN_PASSWORD="admin-password-1", APP_ENV="development",
                      DB_PATH=os.path.join(tempfile.mkdtemp(), "t.db"), LOGIN_LIMIT="1000 per minute")
    import app as portal
    importlib.reload(portal)
    return portal.app.test_client()


def admin(c):
    assert c.post("/api/admin/login", json={"password": "admin-password-1"}).status_code == 200


def test_admin_login_rejects_bad_password(client):
    assert client.post("/api/admin/login", json={"password": "nope"}).status_code == 401


def test_endpoints_require_session(client):
    assert client.get("/api/students").status_code == 401
    assert client.get("/api/student").status_code == 401


def test_student_lifecycle_and_isolation(client):
    admin(client)
    r = client.post("/api/students", json={"profile": {"id": "EGI/1", "name": "Ama", "prog": "OHS"}, "grades": {"OHS 101": "A", "bad": "A", "OHS 102": "Z"}})
    assert r.status_code == 201
    code = r.get_json()["code"]
    assert client.post("/api/students", json={"profile": {"id": "egi/1", "name": "Dup"}}).status_code == 409
    client.post("/api/students", json={"profile": {"id": "EGI/2", "name": "Kofi"}})
    client.post("/api/logout")

    s = client.application.test_client()
    assert s.post("/api/student/login", json={"id": "EGI/1", "code": "WRONG"}).status_code == 401
    assert s.post("/api/student/login", json={"id": "EGI/1", "code": code.lower()}).status_code == 200
    me = s.get("/api/student").get_json()["student"]
    assert me["name"] == "Ama" and me["grades"] == {"OHS 101": "A"} and "code_hash" not in me
    assert s.get("/api/students").status_code == 401          # students cannot list others
    assert s.post("/api/students", json={"profile": {"id": "X", "name": "X"}}).status_code == 401


def test_code_reset_invalidates_old_session_and_code(client):
    admin(client)
    code = client.post("/api/students", json={"profile": {"id": "EGI/9", "name": "Esi"}}).get_json()["code"]
    s = client.application.test_client()
    s.post("/api/student/login", json={"id": "EGI/9", "code": code})
    assert s.get("/api/student").status_code == 200
    new = client.post("/api/students/EGI_9/code").get_json()["code"]
    assert s.get("/api/student").status_code == 401
    assert s.post("/api/student/login", json={"id": "EGI/9", "code": code}).status_code == 401
    assert s.post("/api/student/login", json={"id": "EGI/9", "code": new}).status_code == 200


def test_announcements_and_cross_origin_block(client):
    admin(client)
    assert client.post("/api/announcements", json={"title": "Hi", "body": "There"}).status_code == 201
    assert client.post("/api/announcements", json={"title": ""}).status_code == 400
    assert client.get("/api/announcements").get_json()["items"][0]["title"] == "Hi"
    assert client.post("/api/announcements", json={"title": "x"}, headers={"Origin": "https://evil.example"}).status_code == 403


def test_frontend_served(client):
    assert b"Student Portal" in client.get("/").data
    assert client.get("/app.js").status_code == 200
