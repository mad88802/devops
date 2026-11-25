<<<<<<< HEAD
# Fake Job Posting Detection System (Verdict)

DevOps Academic Project - Group 12 (ING4 Semester 7)

## Overview

The Fake Job Posting Detection System is an automated, rule-based recruitment platform designed to identify fraudulent, deceptive, and suspicious employment listings. The platform evaluates job postings against multi-dimensional indicators (company trust, salary plausibility, application fees, contact credentials, and textual indicators) using an Event-Condition-Action (ECA) expert engine (Rules R1 through R12).

The application provides dedicated workflows for three primary user roles:
- Recruiters: Draft, submit, verify, and manage job postings with audit-trailed manual overrides.
- Candidates: Search verified legitimate opportunities and report suspicious listings.
- IT Administrators: Monitor platform statistics, manage company trust scores, blacklist fraudulent entities, and inspect active detection rules.

---

## Architecture

The project follows a decoupled client-server architecture:

```
DEVOPS_G12_FAKE_POSTING/
|-- backend/
|   |-- app/
|   |   |-- __init__.py           # Flask app factory, CORS, and blueprint registration
|   |   |-- db.py                 # Unified database layer (SQLite and MySQL compatible)
|   |   |-- routes/               # API route handlers
|   |   |   |-- admin_recruiter_routes.py
|   |   |   |-- auth_routes.py
|   |   |   |-- check_routes.py
|   |   |   |-- company_routes.py
|   |   |   |-- posting_routes.py
|   |   |   |-- report_routes.py
|   |   |   `-- stats_routes.py
|   |   `-- services/             # Core business logic and ECA rules engine
|   |       |-- posting_service.py
|   |       |-- stats_service.py
|   |       `-- tocheck_service.py
|   |-- init_db.py                # Database initialization and seeding script
|   |-- requirements.txt          # Python runtime dependencies
|   `-- run.py                    # Application entry point (http://127.0.0.1:5000)
|
|-- frontend/
|   |-- src/
|   |   |-- api/                  # HTTP client and resource facades
|   |   |-- components/           # Reusable UI components
|   |   |-- context/              # Auth and Toast context providers
|   |   |-- i18n/                 # Multi-language dictionary
|   |   |-- lib/                  # Enums, rule definitions, and payload validators
|   |   `-- pages/                # Role-specific views (Recruiter, Candidate, Admin)
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js            # Development server and proxy configuration
|
|-- database/
|   |-- schema.sql                # Full relational schema DDL
|   `-- seed.sql                  # Initial seed data (users, companies, rules, postings)
|
`-- test_app.md                   # Comprehensive end-to-end testing specification
```

---

## User Roles and Capabilities

### 1. Recruiter
- Creates and edits job postings across 10 factual dimensions (US1, US2, US3).
- Triggers automated ECA evaluation via the check endpoint (US4, US5, US6).
- Inspects rule firing justifications in the Condition Ledger.
- Performs manual classification overrides (with mandatory justification notes) if holding Senior or Lead permissions (US7).
- Views operational analytics, rule trigger frequencies, and weekly detection metrics (US10).

### 2. Candidate
- Searches and browses verified job postings (US8). Postings classified as Suspicious or Fraudulent are automatically excluded from public listings.
- Views job descriptions, verified company profiles, and application guidelines (US9).
- Submits scam reports with structured categories (fee requested, phishing, impersonation, unrealistic compensation, unverified contact) and evidence notes (US9).

### 3. IT Administrator
- Audits registered companies, evaluates company-wide fraud rates, and applies blacklists (which cascades fraudulent status to all related postings).
- Inspects the active ECA rule base (R1 to R12), condition thresholds, priority levels, and weights.
- Manages recruiter accounts and reviews audit logs.

---

## ECA Rule Engine Specification

The system classifies job postings into three determination states:
- Legitimate (Risk Score: 0 to 29): Approved for candidate listing.
- Suspicious (Risk Score: 30 to 69): Flagged for administrative or recruiter review.
- Fraudulent (Risk Score: 70 to 100): Blocked from publication.

### Active Detection Rules (R1 - R12)

Rules are stored in the database (`eca_rule` and `eca_rule_condition`) and loaded by the engine.

**Posting check (trigger: ToCheck).** Fake rules are evaluated first, then Suspicious, then Legit. If no rule fires, the posting stays Pending.

- R1 (Fake_NoProfile_Salary_Fee): No company profile + salary level 2 + fee requested -> Fraudulent, Risk 95.
- R2 (Fake_PrepaidFee): Fee requested + payment before interview -> Fraudulent, Risk 90.
- R3 (Fake_SensitiveData): Bank or card details requested + unverified company website -> Fraudulent, Risk 90.
- R4 (Suspicious_TooGoodToBeTrue): Salary level 1 or more + poor description + urgency language -> Suspicious, Risk 65.
- R5 (Suspicious_AnonymousContact): No company profile + free webmail or messaging contact -> Suspicious, Risk 60.
- R6 (Suspicious_BulkPosting): Company under 1 year old + more than 20 postings in 24 hours -> Suspicious, Risk 70.
- R7 (Suspicious_OffPlatformContact): Hidden salary + messaging app only + no fee -> Suspicious, Risk 55.
- R8 (Legit_Verified): Company profile and verified website + realistic salary + no fee + no personal data requested -> Legitimate, Risk 10.

**Candidate reports (trigger: Report).**
- R9 (Escalate_Reported_Posting): 3 or more reports and not already Fraudulent -> Suspicious and escalated for recruiter review.
- R10 (Raise_Risk_On_Many_Reports): 5 or more reports -> risk +20 and high-priority escalation.

**Administration.**
- R11 (Blacklist_Repeat_Offender, trigger: CheckCompany): 3 or more fraudulent postings -> company blacklisted.
- R12 (Reject_Blacklisted_Company, trigger: Insert): new posting from a blacklisted company -> Fraudulent, Risk 100.
---

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm 9 or higher
- Git

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://dev.azure.com/BNKteam/PO_G12/_git/DEVOPS_G12_FAKE_POSTING
cd DEVOPS_G12_FAKE_POSTING
```

### 2. Backend Setup

1. Open a terminal in the project root:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - On Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - On Linux / macOS:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize and seed the SQLite database:
   ```bash
   python init_db.py
   ```
   This generates `backend/jobwatch.db` containing all required tables, ECA rules, default accounts, and seed job postings.

5. Start the Flask backend server:
   ```bash
   python run.py
   ```
   The backend API will run on `http://127.0.0.1:5000`.

### 3. Frontend Setup

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the example environment file:
   - On Windows (PowerShell):
     ```powershell
     cp .env.example .env
     ```
   - On Linux / macOS:
     ```bash
     cp .env.example .env
     ```
   For standard local development, leave `VITE_API_BASE_URL=` blank in `.env`. Vite will automatically proxy `/api` calls to `http://127.0.0.1:5000`.

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## Default Accounts

Seed data created by `python init_db.py` (SQLite):

| Role | Name | ID |
| :--- | :--- | :--- |
| Recruiter | Amine Benkraouda | 1 |
| Recruiter | Imad Chalabi | 2 |
| Recruiter (Senior) | Iheb Bouyahia | 3 |
| Recruiter | Abderrahim Bena Oumeur | 4 |
| Candidate | Sofiane Hamidi (and 4 others) | 1 to 5 |
| IT Administrator | Nadia Belkacem | 1 |
---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Authenticate session by role and user ID.
- `GET /api/auth/accounts` - Retrieve test accounts for quick role-switching.

### Postings and Rule Evaluation
- `GET /api/postings` - Paginated and filtered list of postings.
- `POST /api/postings` - Submit a new job posting.
- `GET /api/postings/<id>` - Retrieve details of a specific posting.
- `PUT /api/postings/<id>` - Update posting details.
- `POST /api/postings/<id>/check` - Execute ECA rules evaluation on a posting.
- `POST /api/postings/<id>/override` - Apply manual recruiter override with justification.
- `GET /api/postings/<id>/history` - Retrieve audit log of classification changes.

### Reports
- `POST /api/reports` - Submit a candidate scam report.
- `GET /api/reports` - List candidate reports.

### Companies
- `GET /api/companies` - List all companies and trust metrics.
- `POST /api/companies` - Register a new company.
- `POST /api/companies/<id>/check` - Run security audit on a company.
- `POST /api/companies/<id>/blacklist` - Blacklist a fraudulent company.

### Statistics and Rules
- `GET /api/stats/summary` - Aggregate metrics (total postings, legitimate, suspicious, fraudulent).
- `GET /api/stats/weekly` - Weekly trend detection data.
- `GET /api/stats/rules` - Firing frequencies across rules R1 to R12.
- `GET /api/rules` - List active ECA rules and condition specifications.

---

## Testing

For end-to-end verification, refer to `test_app.md`.

To run backend automated verification from the terminal:
```bash
python -c "import sys; sys.path.insert(0, 'backend'); from run import app; client = app.test_client(); r = client.get('/api/stats/summary'); print('API Health:', r.status_code, r.json)"
```

To run a rule check test:
```bash
python -c "import sys; sys.path.insert(0, 'backend'); from run import app; client = app.test_client(); r = client.post('/api/postings/5/check', json={'recruiterId': 1}); print('Check Status:', r.status_code, 'Fired Rule:', r.json.get('result', {}).get('firedCode'))"
```

To verify the frontend build:
```bash
cd frontend
npm run build
```

---

## Contributing and Branch Workflow

1. Create a feature branch off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and test locally.
3. Commit with semantic messages (`feat: ...`, `fix: ...`, `docs: ...`).
4. Push and open a Pull Request against `main`.
5. Ensure all conflicts are resolved prior to merge approval.
=======
# devops
>>>>>>> de94c4e7dd010e9b23f0b2b9f91eee51211fcc61
