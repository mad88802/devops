"""Tiny DB-API wrapper: PyMySQL in production, sqlite3 for local dev and testing.

All SQL in the services is written with %s placeholders; for SQLite they are
translated to ?. Only plain SELECT / INSERT / UPDATE / DELETE statements are used.
"""
import os
import sqlite3

from flask import current_app, g


class Connection:
    def __init__(self, raw, backend):
        self.raw = raw
        self.backend = backend

    def _run(self, sql, params):
        if self.backend == "sqlite":
            sql = sql.replace("%s", "?")
        cur = self.raw.cursor()
        cur.execute(sql, tuple(params))
        return cur

    def fetch_one(self, sql, params=()):
        cur = self._run(sql, params)
        row = cur.fetchone()
        cur.close()
        return dict(row) if row is not None else None

    def fetch_all(self, sql, params=()):
        cur = self._run(sql, params)
        rows = cur.fetchall()
        cur.close()
        return [dict(r) for r in rows]

    def insert(self, sql, params=()):
        """Run an INSERT and return the generated id."""
        cur = self._run(sql, params)
        new_id = cur.lastrowid
        cur.close()
        return new_id

    def update(self, sql, params=()):
        """Run an UPDATE and return the number of rows matched/changed."""
        cur = self._run(sql, params)
        n = cur.rowcount
        cur.close()
        return n

    def delete(self, sql, params=()):
        """Run a DELETE and return the number of rows removed."""
        cur = self._run(sql, params)
        n = cur.rowcount
        cur.close()
        return n

    def commit(self):
        self.raw.commit()

    def rollback(self):
        try:
            self.raw.rollback()
        except Exception:
            pass

    def close(self):
        self.raw.close()


def make_factory(cfg):
    backend = cfg.get("DB_BACKEND", "sqlite")
    if backend == "sqlite":
        db_path = cfg.get("SQLITE_PATH", "jobwatch.db")
        if not os.path.isabs(db_path):
            # Resolve relative to backend folder or workspace root if present
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
            alt_path = os.path.join(base_dir, db_path)
            if os.path.exists(alt_path) or not os.path.exists(db_path):
                db_path = alt_path

        def sqlite_factory():
            raw = sqlite3.connect(db_path)
            raw.row_factory = sqlite3.Row
            raw.execute("PRAGMA foreign_keys = ON")
            return Connection(raw, "sqlite")
        return sqlite_factory
    else:
        def mysql_factory():
            import pymysql
            raw = pymysql.connect(
                host=cfg.get("MYSQL_HOST", "127.0.0.1"),
                port=int(cfg.get("MYSQL_PORT", 3306)),
                user=cfg.get("MYSQL_USER", "root"),
                password=cfg.get("MYSQL_PASSWORD", ""),
                database=cfg.get("MYSQL_DATABASE", "jobwatch_test"),
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False,
            )
            return Connection(raw, "mysql")
        return mysql_factory


def get_db():
    """One connection per request."""
    if "db" not in g:
        g.db = current_app.config["DB_FACTORY"]()
    return g.db


def close_connection(_exc=None):
    conn = g.pop("db", None)
    if conn is not None:
        try:
            conn.rollback()      # no-op after a commit; undoes a half-done request
        finally:
            conn.close()
