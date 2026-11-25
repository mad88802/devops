"""Global pytest configuration and fixtures for JobWatch unit tests.

Ensures strict repeatability: every test function executes against an isolated,
freshly seeded SQLite database copy created from a pristine master template.
"""
import os
import shutil
import sqlite3
import sys
from pathlib import Path

import pytest

# Ensure backend directory is in sys.path (Hard rule: Add backend to sys.path)
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from init_db import init_sqlite
from app import create_app


@pytest.fixture(scope="session")
def pristine_db(tmp_path_factory):
    """Initialize a pristine SQLite template database once per test session."""
    session_dir = tmp_path_factory.mktemp("db_template")
    pristine_path = str(session_dir / "jobwatch_pristine.db")
    init_sqlite(pristine_path)
    return pristine_path


@pytest.fixture(autouse=True, scope="session")
def preserve_original_db():
    """Backup backend/jobwatch.db if it exists, and restore it at session teardown."""
    real_db = BACKEND_DIR / "jobwatch.db"
    backup_db = BACKEND_DIR / "jobwatch.db.session_backup"
    had_original = real_db.exists()
    if had_original:
        shutil.copyfile(real_db, backup_db)
    yield
    if had_original and backup_db.exists():
        shutil.copyfile(backup_db, real_db)
        backup_db.unlink(missing_ok=True)
    elif not had_original and real_db.exists():
        real_db.unlink(missing_ok=True)


@pytest.fixture
def test_db_path(pristine_db, tmp_path):
    """Provide a fresh, isolated copy of the seeded database for each test function."""
    db_copy = str(tmp_path / "jobwatch_test.db")
    shutil.copyfile(pristine_db, db_copy)
    return db_copy


@pytest.fixture
def app(test_db_path):
    """Provide a Flask application configured with the per-test database copy."""
    flask_app = create_app({
        "SQLITE_PATH": test_db_path,
        "TESTING": True,
    })
    return flask_app


@pytest.fixture
def client(app):
    """Provide a test client for API requests."""
    with app.test_client() as test_client:
        yield test_client


@pytest.fixture
def db_conn(test_db_path):
    """Provide a direct sqlite3 connection to the per-test database with foreign keys enabled."""
    conn = sqlite3.connect(test_db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    yield conn
    conn.close()


def check_posting(client, posting_id, recruiter_id=1):
    """Helper to trigger POST /api/postings/<id>/check."""
    payload = {}
    if recruiter_id is not None:
        payload["recruiterId"] = recruiter_id
    return client.post(f"/api/postings/{posting_id}/check", json=payload)
