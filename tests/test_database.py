"""Task T1.4: Database integrity, schema existence, seed counts, and constraints.

User Story: US1
Owner: Imad Chalabi
"""
import sqlite3
import pytest


def test_all_tables_exist(db_conn):
    """Verify that all 13 required schema tables exist in the database."""
    expected_tables = {
        "it_admin",
        "recruiter",
        "candidate",
        "company",
        "job_posting",
        "salary_indicators",
        "fee_indicators",
        "content_indicators",
        "report",
        "classification_result",
        "escalation",
        "eca_rule",
        "eca_rule_condition",
    }
    cur = db_conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    existing_tables = {row["name"] for row in cur.fetchall()}
    cur.close()

    missing = expected_tables - existing_tables
    assert not missing, f"Missing tables in database schema: {missing}"


def test_seed_counts(db_conn):
    """Verify exact seed data counts as specified in the project facts."""
    cur = db_conn.cursor()

    cur.execute("SELECT COUNT(*) AS c FROM company")
    assert cur.fetchone()["c"] == 10, "Expected 10 seeded companies"

    cur.execute("SELECT COUNT(*) AS c FROM job_posting")
    assert cur.fetchone()["c"] == 12, "Expected 12 seeded job postings"

    cur.execute("SELECT COUNT(*) AS c FROM candidate")
    assert cur.fetchone()["c"] == 5, "Expected 5 seeded candidates"

    cur.execute("SELECT COUNT(*) AS c FROM recruiter")
    assert cur.fetchone()["c"] == 4, "Expected 4 seeded recruiters"

    cur.execute("SELECT COUNT(*) AS c FROM it_admin")
    assert cur.fetchone()["c"] == 1, "Expected 1 seeded IT admin"

    cur.execute("SELECT COUNT(*) AS c FROM report")
    assert cur.fetchone()["c"] == 9, "Expected 9 seeded reports"

    cur.execute("SELECT COUNT(*) AS c FROM classification_result")
    assert cur.fetchone()["c"] == 5, "Expected 5 seeded classification results"

    cur.execute("SELECT COUNT(*) AS c FROM eca_rule")
    assert cur.fetchone()["c"] == 12, "Expected 12 seeded ECA rules"

    cur.close()


@pytest.mark.parametrize("invalid_salary_level", [-1, 3, 99])
def test_invalid_salary_level_rejected(db_conn, invalid_salary_level):
    """CHECK constraint: salary_level IN (0, 1, 2) must reject invalid values."""
    with pytest.raises(sqlite3.IntegrityError):
        db_conn.execute(
            "INSERT INTO salary_indicators (posting_id, salary_level, salary_hidden) VALUES (12, ?, 0)",
            (invalid_salary_level,),
        )


@pytest.mark.parametrize("invalid_fee_requested", [-1, 2, 5])
def test_invalid_fee_requested_rejected(db_conn, invalid_fee_requested):
    """CHECK constraint: fee_requested IN (0, 1) must reject invalid values."""
    with pytest.raises(sqlite3.IntegrityError):
        db_conn.execute(
            "INSERT INTO fee_indicators (posting_id, fee_requested, fee_type, payment_before_interview) VALUES (12, ?, 0, 0)",
            (invalid_fee_requested,),
        )


@pytest.mark.parametrize("invalid_employment_type", [-1, 3, 10])
def test_invalid_employment_type_rejected(db_conn, invalid_employment_type):
    """CHECK constraint: employment_type IN (0, 1, 2) must reject invalid values."""
    with pytest.raises(sqlite3.IntegrityError):
        db_conn.execute(
            "INSERT INTO job_posting (company_id, title, employment_type) VALUES (1, 'Test Job', ?)",
            (invalid_employment_type,),
        )


def test_fee_requested_without_fee_type_rejected(db_conn):
    """CHECK constraint: fee_requested = 0 OR fee_type > 0.
    A fee requested (1) with fee_type = 0 must be rejected.
    """
    with pytest.raises(sqlite3.IntegrityError):
        db_conn.execute(
            "INSERT INTO fee_indicators (posting_id, fee_requested, fee_type, payment_before_interview) VALUES (12, 1, 0, 0)"
        )


def test_no_fee_requested_with_fee_type_rejected(db_conn):
    """CHECK constraint: fee_requested = 1 OR (fee_type = 0 AND payment_before_interview = 0).
    A fee not requested (0) with fee_type > 0 must be rejected.
    """
    with pytest.raises(sqlite3.IntegrityError):
        db_conn.execute(
            "INSERT INTO fee_indicators (posting_id, fee_requested, fee_type, payment_before_interview) VALUES (12, 0, 1, 0)"
        )


def test_unique_candidate_and_posting_report_constraint(db_conn):
    """UNIQUE(posting_id, candidate_id) constraint on report table.
    Candidate 1 already reported posting 11 in seed data.
    """
    with pytest.raises(sqlite3.IntegrityError):
        db_conn.execute(
            "INSERT INTO report (posting_id, candidate_id, reason, report_date) VALUES (11, 1, 1, '2026-11-20')"
        )
