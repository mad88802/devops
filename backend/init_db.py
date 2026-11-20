#!/usr/bin/env python3
"""Initialize database for JobWatch (Fake Job Posting Detection).
Creates all tables and seeds initial data. Supports SQLite (default) and MySQL.
"""
import os
import sqlite3
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB = os.path.join(BASE_DIR, "jobwatch.db")

SQLITE_SCHEMA = """
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS eca_rule_condition;
DROP TABLE IF EXISTS eca_rule;
DROP TABLE IF EXISTS escalation;
DROP TABLE IF EXISTS classification_result;
DROP TABLE IF EXISTS report;
DROP TABLE IF EXISTS content_indicators;
DROP TABLE IF EXISTS fee_indicators;
DROP TABLE IF EXISTS salary_indicators;
DROP TABLE IF EXISTS job_posting;
DROP TABLE IF EXISTS candidate;
DROP TABLE IF EXISTS recruiter;
DROP TABLE IF EXISTS company;
DROP TABLE IF EXISTS it_admin;

CREATE TABLE it_admin (
    admin_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE
);

CREATE TABLE recruiter (
    recruiter_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    surname      TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    role         TEXT NOT NULL DEFAULT 'R' CHECK (role IN ('R','S')),
    admin_id     INTEGER,
    FOREIGN KEY (admin_id) REFERENCES it_admin(admin_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE candidate (
    candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    surname      TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE
);

CREATE TABLE company (
    company_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    country             TEXT,
    industry            TEXT,
    age_years           INTEGER NOT NULL DEFAULT 0 CHECK (age_years >= 0),
    has_profile         INTEGER NOT NULL DEFAULT 0 CHECK (has_profile IN (0,1)),
    website_verified    INTEGER NOT NULL DEFAULT 0 CHECK (website_verified IN (0,1)),
    postings_last_24h   INTEGER NOT NULL DEFAULT 0 CHECK (postings_last_24h >= 0),
    fake_postings_count INTEGER NOT NULL DEFAULT 0 CHECK (fake_postings_count >= 0),
    blacklisted         INTEGER NOT NULL DEFAULT 0 CHECK (blacklisted IN (0,1)),
    admin_id            INTEGER,
    FOREIGN KEY (admin_id) REFERENCES it_admin(admin_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE job_posting (
    posting_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id      INTEGER NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    location        TEXT,
    employment_type INTEGER NOT NULL DEFAULT 0 CHECK (employment_type IN (0,1,2)),
    posted_date     TEXT NOT NULL DEFAULT (DATE('now')),
    status          TEXT NOT NULL DEFAULT 'P' CHECK (status IN ('P','L','S','F')),
    risk_score      INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    FOREIGN KEY (company_id) REFERENCES company(company_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE salary_indicators (
    posting_id    INTEGER PRIMARY KEY,
    salary_min    INTEGER CHECK (salary_min IS NULL OR salary_min >= 0),
    salary_max    INTEGER CHECK (salary_max IS NULL OR salary_max >= 0),
    currency      TEXT,
    salary_level  INTEGER NOT NULL DEFAULT 0 CHECK (salary_level IN (0,1,2)),
    salary_hidden INTEGER NOT NULL DEFAULT 0 CHECK (salary_hidden IN (0,1)),
    CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE fee_indicators (
    posting_id                INTEGER PRIMARY KEY,
    fee_requested             INTEGER NOT NULL DEFAULT 0 CHECK (fee_requested IN (0,1)),
    fee_type                  INTEGER NOT NULL DEFAULT 0 CHECK (fee_type IN (0,1,2,3)),
    payment_before_interview  INTEGER NOT NULL DEFAULT 0 CHECK (payment_before_interview IN (0,1)),
    CHECK (fee_requested = 1 OR (fee_type = 0 AND payment_before_interview = 0)),
    CHECK (fee_requested = 0 OR fee_type > 0),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE content_indicators (
    posting_id              INTEGER PRIMARY KEY,
    personal_info_requested INTEGER NOT NULL DEFAULT 0 CHECK (personal_info_requested IN (0,1,2)),
    urgency_language        INTEGER NOT NULL DEFAULT 0 CHECK (urgency_language IN (0,1,2)),
    description_quality     INTEGER NOT NULL DEFAULT 1 CHECK (description_quality IN (0,1,2)),
    contact_channel         INTEGER NOT NULL DEFAULT 0 CHECK (contact_channel IN (0,1,2)),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE report (
    report_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    posting_id   INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    reason       INTEGER NOT NULL CHECK (reason BETWEEN 1 AND 4),
    report_date  TEXT NOT NULL DEFAULT (DATE('now')),
    UNIQUE (posting_id, candidate_id),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE classification_result (
    result_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    posting_id    INTEGER NOT NULL,
    recruiter_id  INTEGER,
    label         TEXT NOT NULL CHECK (label IN ('L','S','F')),
    score         INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    rule_id       TEXT,
    decision_date TEXT NOT NULL DEFAULT (DATE('now')),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (recruiter_id) REFERENCES recruiter(recruiter_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE escalation (
    escalation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    posting_id    INTEGER NOT NULL,
    rule_id       TEXT NOT NULL,
    priority      TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','high')),
    report_count  INTEGER NOT NULL CHECK (report_count >= 0),
    created_at    TEXT NOT NULL DEFAULT (DATETIME('now')),
    resolved_at   TEXT NULL,
    resolved_by   INTEGER NULL,
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES recruiter(recruiter_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE eca_rule (
    rule_id        TEXT NOT NULL PRIMARY KEY,
    name           TEXT NOT NULL UNIQUE,
    at_trigger     TEXT NOT NULL CHECK (at_trigger IN ('ToCheck','Report','CheckCompany','Insert')),
    active         INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    act_status     TEXT NULL CHECK (act_status IS NULL OR act_status IN ('L','S','F')),
    act_risk_score INTEGER NULL CHECK (act_risk_score IS NULL OR act_risk_score BETWEEN 0 AND 100),
    act_risk_delta INTEGER NOT NULL DEFAULT 0 CHECK (act_risk_delta BETWEEN -100 AND 100),
    act_escalate   TEXT NULL CHECK (act_escalate IS NULL OR act_escalate IN ('normal','high')),
    act_blacklisted INTEGER NULL CHECK (act_blacklisted IS NULL OR act_blacklisted IN (0,1)),
    updated_at     TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE TABLE eca_rule_condition (
    condition_id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id      TEXT NOT NULL,
    seq          INTEGER NOT NULL CHECK (seq >= 1),
    participant  TEXT NOT NULL CHECK (participant IN ('C','S','F','K','P','Rp')),
    attribute    TEXT NOT NULL,
    op           TEXT NOT NULL CHECK (op IN ('=','!=','<','<=','>','>=')),
    value_int    INTEGER NULL,
    value_text   TEXT NULL,
    UNIQUE (rule_id, seq),
    FOREIGN KEY (rule_id) REFERENCES eca_rule(rule_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_posting_status ON job_posting(status);
CREATE INDEX idx_result_posting ON classification_result(posting_id, decision_date);
CREATE INDEX idx_escalation_open ON escalation(resolved_at, priority);
CREATE INDEX idx_rule_trigger ON eca_rule(at_trigger, active);
"""

SQLITE_SEED = """
INSERT INTO it_admin (admin_id, name, email) VALUES
 (1, 'Nadia Belkacem', 'nadia.belkacem@jobwatch.dz');

INSERT INTO recruiter (recruiter_id, name, surname, email, role, admin_id) VALUES
 (1, 'Amine', 'Benkraouda', 'amine.benkraouda@jobwatch.dz', 'R', 1),
 (2, 'Imad',  'Chalabi',     'imad.chalabi@jobwatch.dz',     'R', 1),
 (3, 'Iheb',  'Bouyahia',    'iheb.bouyahia@jobwatch.dz',    'S', 1),
 (4, 'Abderrahim', 'Bena Oumeur', 'abderrahim.benaoumeur@jobwatch.dz', 'R', 1);

INSERT INTO candidate (candidate_id, name, surname, email) VALUES
 (1, 'Sofiane', 'Hamidi',   'sofiane.hamidi@mail.dz'),
 (2, 'Lina',    'Boudiaf',  'lina.boudiaf@mail.dz'),
 (3, 'Karim',   'Zerouki',  'karim.zerouki@mail.dz'),
 (4, 'Meriem',  'Taleb',    'meriem.taleb@mail.dz'),
 (5, 'Anis',    'Bensaid',  'anis.bensaid@mail.dz');

INSERT INTO company
 (company_id, name, country, industry, age_years, has_profile, website_verified,
  postings_last_24h, fake_postings_count, blacklisted, admin_id) VALUES
 (1,  'TechNova Solutions',      'Algeria', 'IT',        8, 1, 1,  2, 0, 0, 1),
 (2,  'Medi-Care Clinic',        'Algeria', 'Health',   12, 1, 1,  1, 0, 0, 1),
 (3,  'QuickCash Global Jobs',   'Cyprus',  'Finance',   0, 1, 0, 35, 1, 0, 1),
 (4,  'EasyHire International',  'Nigeria', 'Staffing',  1, 0, 0,  4, 2, 0, 1),
 (5,  'Global Opportunities Ltd','UAE',     'Staffing',  2, 1, 0,  1, 3, 0, 1),
 (6,  'FastTrack Recruitment',   'Unknown', 'Staffing',  0, 0, 0,  0, 4, 1, 1),
 (7,  'Atlas Logistics',         'Algeria', 'Logistics', 5, 1, 0,  1, 0, 0, 1),
 (8,  'Horizon Staffing',        'Algeria', 'Staffing',  3, 0, 0,  1, 0, 0, 1),
 (9,  'PrimeEdge Consulting',    'France',  'Consulting',6, 1, 1,  2, 0, 0, 1),
 (10, 'Ghost Talent Hub',        'Unknown', 'Staffing',  2, 1, 0,  1, 0, 0, 1);

INSERT INTO job_posting
 (posting_id, company_id, title, description, location, employment_type,
  posted_date, status, risk_score) VALUES
 (1,  1, 'Backend Developer',
      'Build and maintain REST services. 3+ years experience, Python or Java. Salary range stated, interviews on site.',
      'Oran', 0, '2026-10-12', 'L', 10),
 (2,  2, 'Registered Nurse',
      'Night and day shifts in our Oran clinic. Diploma required. Apply with CV through the corporate address.',
      'Oran', 0, '2026-10-14', 'L', 10),
 (3,  4, 'Work from home - earn 5000 USD per week!!!',
      'No experience needed. Pay a small registration fee to secure your place. Limited spots.',
      'Remote', 2, '2026-10-20', 'F', 95),
 (4,  8, 'Warehouse Operator',
      'Warehouse job, start immediately. Contact us on our webmail address.',
      'Algiers', 0, '2026-10-22', 'S', 60),
 (5,  6, 'Overseas Hospitality Assistant',
      'Great benefits abroad, contact our agent.',
      'Dubai', 0, '2026-10-25', 'F', 100),
 (6,  3, 'Data Entry Clerk',
      'Simple data entry tasks, flexible hours.',
      'Remote', 1, '2026-11-03', 'P', 0),
 (7,  5, 'Hotel Staff - Visa Included',
      'Overseas positions. Equipment and visa fee payable before your interview.',
      'Dubai', 0, '2026-11-01', 'P', 0),
 (8,  7, 'Dispatcher',
      'Coordinate daily deliveries. Send a copy of your bank card to complete onboarding.',
      'Oran', 0, '2026-11-02', 'P', 0),
 (9,  9, 'Sales Superstar',
      'HUGE PAY. Apply NOW, only today!',
      'Remote', 0, '2026-11-02', 'P', 0),
 (10, 10,'Remote Personal Assistant',
      'Assist our manager remotely. Salary discussed privately. Talk to us on the messaging app only.',
      'Remote', 1, '2026-11-01', 'P', 0),
 (11, 1, 'Data Analyst',
      'Analyse sales data and build dashboards. SQL and Python required, hybrid work, corporate contact.',
      'Oran', 0, '2026-10-28', 'P', 0),
 (12, 2, 'Receptionist',
      'Welcome patients and manage appointments. Competitive salary, CV required.',
      'Oran', 0, '2026-11-02', 'P', 0);

INSERT INTO salary_indicators
 (posting_id, salary_min, salary_max, currency, salary_level, salary_hidden) VALUES
 (1,  120000, 180000, 'DZD', 0, 0),
 (2,   60000,  90000, 'DZD', 0, 0),
 (3,   15000,  20000, 'USD', 2, 0),
 (4,   35000,  45000, 'DZD', 0, 0),
 (5,    2500,   3500, 'EUR', 1, 0),
 (6,   30000,  40000, 'USD', 0, 0),
 (7,    2000,   3000, 'EUR', 1, 0),
 (8,   50000,  70000, 'DZD', 0, 0),
 (9,  200000, 400000, 'DZD', 1, 0),
 (10,   NULL,   NULL,  NULL, 0, 1),
 (11, 100000, 150000, 'DZD', 0, 0),
 (12,  90000, 110000, 'DZD', 1, 0);

INSERT INTO fee_indicators
 (posting_id, fee_requested, fee_type, payment_before_interview) VALUES
 (1,  0, 0, 0),
 (2,  0, 0, 0),
 (3,  1, 2, 0),
 (4,  0, 0, 0),
 (5,  0, 0, 0),
 (6,  0, 0, 0),
 (7,  1, 3, 1),
 (8,  0, 0, 0),
 (9,  0, 0, 0),
 (10, 0, 0, 0),
 (11, 0, 0, 0),
 (12, 0, 0, 0);

INSERT INTO content_indicators
 (posting_id, personal_info_requested, urgency_language, description_quality, contact_channel) VALUES
 (1,  0, 0, 2, 0),
 (2,  0, 0, 2, 0),
 (3,  1, 2, 0, 1),
 (4,  1, 0, 1, 1),
 (5,  0, 1, 1, 1),
 (6,  0, 0, 1, 0),
 (7,  1, 1, 1, 0),
 (8,  2, 0, 1, 0),
 (9,  0, 1, 0, 0),
 (10, 0, 0, 1, 2),
 (11, 0, 0, 2, 0),
 (12, 1, 0, 1, 0);

INSERT INTO report (report_id, posting_id, candidate_id, reason, report_date) VALUES
 (1,  11, 1, 1, '2026-10-30'),
 (2,  11, 2, 2, '2026-10-31'),
 (3,  11, 3, 1, '2026-11-01'),
 (4,   4, 1, 3, '2026-10-24'),
 (5,   4, 2, 3, '2026-10-24'),
 (6,   4, 3, 2, '2026-10-25'),
 (7,   4, 4, 1, '2026-10-26'),
 (8,   4, 5, 3, '2026-10-27'),
 (9,   3, 5, 4, '2026-10-21');

INSERT INTO classification_result
 (result_id, posting_id, recruiter_id, label, score, rule_id, decision_date) VALUES
 (1, 1, 1,    'L', 10,  'R8',  '2026-10-12'),
 (2, 2, 1,    'L', 10,  'R8',  '2026-10-14'),
 (3, 3, 2,    'F', 95,  'R1',  '2026-10-20'),
 (4, 4, 2,    'S', 60,  'R5',  '2026-10-22'),
 (5, 5, NULL, 'F', 100, 'R12', '2026-10-25');

INSERT INTO eca_rule (rule_id, name, at_trigger, active, act_status, act_risk_score,
                      act_risk_delta, act_escalate, act_blacklisted) VALUES
 ('R1', 'Fake_NoProfile_Salary_Fee', 'ToCheck', 1, 'F', 95, 0, NULL, NULL),
 ('R2', 'Fake_PrepaidFee', 'ToCheck', 1, 'F', 90, 0, NULL, NULL),
 ('R3', 'Fake_SensitiveData', 'ToCheck', 1, 'F', 90, 0, NULL, NULL),
 ('R4', 'Suspicious_TooGoodToBeTrue', 'ToCheck', 1, 'S', 65, 0, NULL, NULL),
 ('R5', 'Suspicious_AnonymousContact', 'ToCheck', 1, 'S', 60, 0, NULL, NULL),
 ('R6', 'Suspicious_BulkPosting', 'ToCheck', 1, 'S', 70, 0, NULL, NULL),
 ('R7', 'Suspicious_OffPlatformContact', 'ToCheck', 1, 'S', 55, 0, NULL, NULL),
 ('R8', 'Legit_Verified', 'ToCheck', 1, 'L', 10, 0, NULL, NULL),
 ('R9', 'Escalate_Reported_Posting', 'Report', 1, 'S', NULL, 0, 'normal', NULL),
 ('R10', 'Raise_Risk_On_Many_Reports', 'Report', 1, NULL, NULL, 20, 'high', NULL),
 ('R11', 'Blacklist_Repeat_Offender', 'CheckCompany', 1, NULL, NULL, 0, NULL, 1),
 ('R12', 'Reject_Blacklisted_Company', 'Insert', 1, 'F', 100, 0, NULL, NULL);

INSERT INTO eca_rule_condition (rule_id, seq, participant, attribute, op, value_int, value_text) VALUES
 ('R1', 1, 'C', 'HasProfile', '=', 0, NULL),
 ('R1', 2, 'S', 'SalaryLevel', '=', 2, NULL),
 ('R1', 3, 'F', 'FeeRequested', '=', 1, NULL),
 ('R2', 1, 'F', 'FeeRequested', '=', 1, NULL),
 ('R2', 2, 'F', 'PaymentBeforeInterview', '=', 1, NULL),
 ('R3', 1, 'K', 'PersonalInfoRequested', '=', 2, NULL),
 ('R3', 2, 'C', 'WebsiteVerified', '=', 0, NULL),
 ('R4', 1, 'S', 'SalaryLevel', '>=', 1, NULL),
 ('R4', 2, 'K', 'DescriptionQuality', '=', 0, NULL),
 ('R4', 3, 'K', 'UrgencyLanguage', '>=', 1, NULL),
 ('R5', 1, 'C', 'HasProfile', '=', 0, NULL),
 ('R5', 2, 'K', 'ContactChannel', '>=', 1, NULL),
 ('R6', 1, 'C', 'AgeYears', '<', 1, NULL),
 ('R6', 2, 'C', 'PostingsLast24h', '>', 20, NULL),
 ('R7', 1, 'S', 'SalaryHidden', '=', 1, NULL),
 ('R7', 2, 'K', 'ContactChannel', '=', 2, NULL),
 ('R7', 3, 'F', 'FeeRequested', '=', 0, NULL),
 ('R8', 1, 'C', 'HasProfile', '=', 1, NULL),
 ('R8', 2, 'C', 'WebsiteVerified', '=', 1, NULL),
 ('R8', 3, 'S', 'SalaryLevel', '=', 0, NULL),
 ('R8', 4, 'F', 'FeeRequested', '=', 0, NULL),
 ('R8', 5, 'K', 'PersonalInfoRequested', '=', 0, NULL),
 ('R9', 1, 'Rp', 'CountReports', '>=', 3, NULL),
 ('R9', 2, 'P', 'Status', '!=', NULL, 'F'),
 ('R10', 1, 'Rp', 'CountReports', '>=', 5, NULL),
 ('R11', 1, 'C', 'FakePostingsCount', '>=', 3, NULL),
 ('R12', 1, 'C', 'Blacklisted', '=', 1, NULL);
"""


def init_sqlite(db_path=SQLITE_DB):
    print(f"[*] Initializing SQLite database at: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.executescript(SQLITE_SCHEMA)
    conn.executescript(SQLITE_SEED)
    conn.commit()
    conn.close()
    print("[+] SQLite database initialized and seeded successfully!")


def init_mysql():
    host = os.getenv("MYSQL_HOST", "127.0.0.1")
    port = int(os.getenv("MYSQL_PORT", 3306))
    user = os.getenv("MYSQL_USER", "root")
    password = os.getenv("MYSQL_PASSWORD", "")
    database = os.getenv("MYSQL_DATABASE", "jobwatch_test")

    print(f"[*] Connecting to MySQL at {host}:{port} as {user}...")
    try:
        import pymysql
    except ImportError:
        print("[-] pymysql not installed. Run: pip install pymysql")
        sys.exit(1)

    schema_file = os.path.join(BASE_DIR, "..", "database", "schema.sql")
    seed_file = os.path.join(BASE_DIR, "..", "database", "seed.sql")

    if not os.path.exists(schema_file) or not os.path.exists(seed_file):
        print("[-] database/schema.sql or database/seed.sql not found!")
        sys.exit(1)

    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    with open(seed_file, "r", encoding="utf-8") as f:
        seed_sql = f.read()

    conn = pymysql.connect(host=host, port=port, user=user, password=password, autocommit=True)
    cur = conn.cursor()
    for statement in schema_sql.split(";"):
        stmt = statement.strip()
        if stmt:
            cur.execute(stmt)
    for statement in seed_sql.split(";"):
        stmt = statement.strip()
        if stmt:
            cur.execute(stmt)
    cur.close()
    conn.close()
    print("[+] MySQL database initialized and seeded successfully!")


if __name__ == "__main__":
    backend = os.getenv("DB_BACKEND", "sqlite").lower()
    if backend == "mysql":
        init_mysql()
    else:
        target = sys.argv[1] if len(sys.argv) > 1 else SQLITE_DB
        init_sqlite(target)
