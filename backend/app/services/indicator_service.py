"""T2.3 - Indicator getters: Get_Salary, Get_Fee, Get_Content.

Used by the HTTP routes and, later, by the ECA rule engine (S, F, K participants).
An indicator row is optional (0..1 per posting): a posting that exists but has no
row raises NotFoundError with a specific message.
"""
from ..errors import NotFoundError

_TABLES = {"salary": "salary_indicators", "fee": "fee_indicators",
           "content": "content_indicators"}


def _get(conn, kind, posting_id):
    table = _TABLES[kind]          # table name comes from a fixed dict, never from input
    if conn.fetch_one("SELECT 1 AS ok FROM job_posting WHERE posting_id = %s",
                      (posting_id,)) is None:
        raise NotFoundError(f"posting {posting_id} not found")
    row = conn.fetch_one(f"SELECT * FROM {table} WHERE posting_id = %s", (posting_id,))
    if row is None:
        raise NotFoundError(f"posting {posting_id} has no {kind} indicators")
    return row


def get_salary(conn, posting_id):
    return _get(conn, "salary", posting_id)


def get_fee(conn, posting_id):
    return _get(conn, "fee", posting_id)


def get_content(conn, posting_id):
    return _get(conn, "content", posting_id)


def find_indicators(conn, posting_id):
    """Same data, but None instead of an error when a block is missing."""
    out = {}
    for kind, table in _TABLES.items():
        out[table] = conn.fetch_one(f"SELECT * FROM {table} WHERE posting_id = %s",
                                    (posting_id,))
    return out
