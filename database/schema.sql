CREATE DATABASE IF NOT EXISTS jobwatch_test
    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE jobwatch_test;

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


-- les acteurs

CREATE TABLE it_admin (
    admin_id    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recruiter (
    recruiter_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    surname      VARCHAR(100) NOT NULL,
    email        VARCHAR(100) NOT NULL UNIQUE,
    role         CHAR(1) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'R' CHECK (role IN ('R','S')),
    admin_id     INT,                         -- IT_Admin 1 manages 0..n Recruiter
    FOREIGN KEY (admin_id) REFERENCES it_admin(admin_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE candidate (
    candidate_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    surname      VARCHAR(100) NOT NULL,
    email        VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- companies

CREATE TABLE company (
    company_id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    country            VARCHAR(50),
    industry           VARCHAR(50),
    age_years          INT NOT NULL DEFAULT 0 CHECK (age_years >= 0),
    has_profile        INT NOT NULL DEFAULT 0 CHECK (has_profile IN (0,1)),
    website_verified   INT NOT NULL DEFAULT 0 CHECK (website_verified IN (0,1)),
    postings_last_24h  INT NOT NULL DEFAULT 0 CHECK (postings_last_24h >= 0),
    fake_postings_count INT NOT NULL DEFAULT 0 CHECK (fake_postings_count >= 0),
    blacklisted        INT NOT NULL DEFAULT 0 CHECK (blacklisted IN (0,1)),
    admin_id           INT,                   -- IT_Admin 1 manages 0..n Company
    FOREIGN KEY (admin_id) REFERENCES it_admin(admin_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE job_posting (
    posting_id      INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    company_id      INT NOT NULL,             -- Company 1 publishes 0..n JobPosting
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    location        VARCHAR(100),
    employment_type INT NOT NULL DEFAULT 0 CHECK (employment_type IN (0,1,2)),
    posted_date     DATE NOT NULL DEFAULT (CURRENT_DATE),
    status          CHAR(1) CHARACTER SET ascii COLLATE ascii_bin NOT NULL DEFAULT 'P' CHECK (status IN ('P','L','S','F')),
    risk_score      INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    FOREIGN KEY (company_id) REFERENCES company(company_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE salary_indicators (
    posting_id    INT NOT NULL PRIMARY KEY,
    salary_min    INT CHECK (salary_min IS NULL OR salary_min >= 0),
    salary_max    INT CHECK (salary_max IS NULL OR salary_max >= 0),
    currency      CHAR(3),
    salary_level  INT NOT NULL DEFAULT 0 CHECK (salary_level IN (0,1,2)),
    salary_hidden INT NOT NULL DEFAULT 0 CHECK (salary_hidden IN (0,1)),
    CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fee_indicators (
    posting_id                INT NOT NULL PRIMARY KEY,
    fee_requested             INT NOT NULL DEFAULT 0 CHECK (fee_requested IN (0,1)),
    fee_type                  INT NOT NULL DEFAULT 0 CHECK (fee_type IN (0,1,2,3)),
    payment_before_interview  INT NOT NULL DEFAULT 0 CHECK (payment_before_interview IN (0,1)),
    -- no fee requested => no fee type and no prepayment
    CHECK (fee_requested = 1 OR (fee_type = 0 AND payment_before_interview = 0)),
    CHECK (fee_requested = 0 OR fee_type > 0),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE content_indicators (
    posting_id             INT NOT NULL PRIMARY KEY,
    personal_info_requested INT NOT NULL DEFAULT 0 CHECK (personal_info_requested IN (0,1,2)),
    urgency_language       INT NOT NULL DEFAULT 0 CHECK (urgency_language IN (0,1,2)),
    description_quality    INT NOT NULL DEFAULT 1 CHECK (description_quality IN (0,1,2)),
    contact_channel        INT NOT NULL DEFAULT 0 CHECK (contact_channel IN (0,1,2)),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE report (
    report_id    INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    posting_id   INT NOT NULL,
    candidate_id INT NOT NULL,
    reason       INT NOT NULL CHECK (reason BETWEEN 1 AND 4),
    report_date  DATE NOT NULL DEFAULT (CURRENT_DATE),
    UNIQUE (posting_id, candidate_id),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidate(candidate_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE classification_result (
    result_id     INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    posting_id    INT NOT NULL,
    recruiter_id  INT,
    label         CHAR(1) CHARACTER SET ascii COLLATE ascii_bin NOT NULL CHECK (label IN ('L','S','F')),
    score         INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    rule_id       VARCHAR(10),
    decision_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (recruiter_id) REFERENCES recruiter(recruiter_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE INDEX idx_posting_status  ON job_posting(status);
CREATE INDEX idx_result_posting  ON classification_result(posting_id, decision_date);


-- US6 / T6.3: escalation queue for recruiters (rules R9 and R10 => R.ToCheck(P))
-- One OPEN row (resolved_at IS NULL) per posting; a recruiter's ToCheck closes it.

CREATE TABLE escalation (
    escalation_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    posting_id    INT NOT NULL,
    rule_id       VARCHAR(10) NOT NULL,
    priority      VARCHAR(6) NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal','high')),
    report_count  INT NOT NULL CHECK (report_count >= 0),
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at   DATETIME NULL,
    resolved_by   INT NULL,
    FOREIGN KEY (posting_id) REFERENCES job_posting(posting_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES recruiter(recruiter_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_escalation_open ON escalation(resolved_at, priority);


-- US9 / T9.1: ECA rule repository in the database (rules can change without redeploying)
-- One row per rule + one row per condition of its "under" part (a conjunction).
-- Mirrors engine/rules.json: R1-R8 (ToCheck), R9-R10 (Report), R11 (CheckCompany), R12 (Insert).

CREATE TABLE eca_rule (
    rule_id        VARCHAR(10) NOT NULL PRIMARY KEY,               -- 'R1' ... 'R12'
    name           VARCHAR(100) NOT NULL UNIQUE,
    at_trigger     VARCHAR(20) NOT NULL
                   CHECK (at_trigger IN ('ToCheck','Report','CheckCompany','Insert')),
    active         INT NOT NULL DEFAULT 1 CHECK (active IN (0,1)), -- 0 = switched off, not deleted
    -- acting part (which columns are used depends on the trigger)
    act_status     CHAR(1) CHARACTER SET ascii COLLATE ascii_bin NULL
                   CHECK (act_status IS NULL OR act_status IN ('L','S','F')),  -- P.Status(..)
    act_risk_score INT NULL
                   CHECK (act_risk_score IS NULL OR act_risk_score BETWEEN 0 AND 100),   -- P.RiskScore(n)
    act_risk_delta INT NOT NULL DEFAULT 0
                   CHECK (act_risk_delta BETWEEN -100 AND 100),    -- P.RiskScore(P.RiskScore + n)
    act_escalate   VARCHAR(6) NULL
                   CHECK (act_escalate IS NULL OR act_escalate IN ('normal','high')),    -- R.ToCheck(P)
    act_blacklisted INT NULL
                   CHECK (act_blacklisted IS NULL OR act_blacklisted IN (0,1)),          -- C.Blacklisted(n)
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- a ToCheck / Insert rule decides a status AND a score; a CheckCompany rule blacklists;
    -- a Report rule needs at least one of status, risk delta, escalation
    CHECK (
        (at_trigger IN ('ToCheck','Insert') AND act_status IS NOT NULL AND act_risk_score IS NOT NULL)
     OR (at_trigger = 'CheckCompany' AND act_blacklisted IS NOT NULL)
     OR (at_trigger = 'Report' AND (act_status IS NOT NULL OR act_risk_delta <> 0 OR act_escalate IS NOT NULL))
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE eca_rule_condition (
    condition_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    rule_id      VARCHAR(10) NOT NULL,
    seq          INT NOT NULL CHECK (seq >= 1),                    -- order inside the rule
    participant  VARCHAR(2)  NOT NULL
                 CHECK (participant IN ('C','S','F','K','P','Rp')), -- C company, S salary, F fee, K content, P posting, Rp reports
    attribute    VARCHAR(40) NOT NULL,                             -- name used in the brief, e.g. SalaryLevel
    op           VARCHAR(2)  NOT NULL CHECK (op IN ('=','!=','<','<=','>','>=')),
    value_int    INT NULL,                                         -- coded number, e.g. 0 / 1 / 2 / 20
    value_text   VARCHAR(10) NULL,                                 -- coded text, e.g. 'F' for P.Status
    UNIQUE (rule_id, seq),
    CHECK ((value_int IS NOT NULL AND value_text IS NULL)
        OR (value_int IS NULL AND value_text IS NOT NULL)),        -- exactly one value
    FOREIGN KEY (rule_id) REFERENCES eca_rule(rule_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_rule_trigger ON eca_rule(at_trigger, active);
