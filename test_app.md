# JobWatch — Fake Job Posting Detection (Application Test Guide)

This guide documents how to set up, run, and test the **JobWatch (Verdict)** application in accordance with **LAB PRJ12 (Azure DevOps LAB ING4-DS)**.

---

## 1. Quick Setup & Execution

### 1.1 Backend (Flask API)

#### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Packages: `Flask`, `PyMySQL`, `flask-cors`

#### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Step 2: Initialize the Database
The application supports both **SQLite** (zero-config, recommended for local dev/testing) and **MySQL** (production/staging).

To initialize SQLite with all tables, constraints, and seed data:
```bash
python init_db.py
```
*(Creates `jobwatch.db` in the `backend/` directory with 12 job postings, 10 companies, recruiters, candidates, admin, reports, and all 12 ECA rules).*

*(Optional) If using MySQL:*
```bash
# Ensure MySQL is running on 127.0.0.1:3306 with database jobwatch_test
set DB_BACKEND=mysql
python init_db.py
```

#### Step 3: Run the Server
```bash
python run.py
```
The Flask API runs at **`http://127.0.0.1:5000`** with `/api` endpoints and CORS enabled.

---

### 1.2 Frontend (React 19 + Vite)

#### Prerequisites
- Node.js 18+ and npm

#### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

#### Step 2: Run Development Server
```bash
npm run dev:web
```
The Vite server starts at **`http://localhost:5173`** and automatically proxies all `/api/*` calls to the Flask backend running on port 5000.

#### Step 3: Production Build Test
```bash
npm run build
```
*(Builds static bundle into `frontend/dist/` with zero errors).*

---

## 2. Architecture Overview & Refactoring

### 2.1 Backend Architecture
The backend follows the **ECA-Driven Service Architecture** specified in Appendix A.2 of the project brief:
- **Presentation Layer**: Exposes REST interfaces under `/api`.
- **Business Layer (Web Services)**:
  - `Posting_Intf` (`services/posting_service.py`): Insert, Display, Remove, List, and Set_Status.
  - `Company_Intf` (`services/company_service.py`): Company data getters and validations.
  - `Indicator Services` (`services/indicator_service.py`): `Salary_Intf`, `Fee_Intf`, `Content_Intf`.
  - `Candidate_Intf` & `Report_Intf` (`services/candidate_service.py`, `services/report_service.py`): Candidate reports and count getters.
  - `Admin_Intf` (`services/admin_company_service.py`, `services/recruiter_service.py`): Company & recruiter management.
  - `ECA Rule Engine` (`engine/evaluator.py`, `engine/repository.py`): Evaluates rules using only service getters (never direct database queries).
- **Persistence Layer**: `jobwatch.db` / MySQL containing application tables, classification history, escalations, and dynamic rule definitions.

### 2.2 Frontend Architecture (Fixed & Cleaned)
The frontend source code has been consolidated into a clean, modern standard React architecture inside `frontend/src/`:
```
frontend/src/
├── api/
│   ├── client.js             # Consolidated API facade
│   ├── core.js               # Fetch wrapper and error handling
│   ├── postingApi.js         # Postings API methods
│   ├── reportApi.js          # Reporting API methods
│   └── statsApi.js           # Statistics API methods
├── components/
│   ├── ConditionLedger.jsx   # Rule condition ledger (pass/fail inspector)
│   ├── DashboardFilters.jsx  # Weekly and per-company filters
│   ├── DataTable.jsx         # Accessible table shell
│   ├── FormField.jsx         # Form controls with coded-value segmented pills
│   ├── Icon.jsx              # Vector SVG icon system
│   ├── Layout.jsx            # Application shell with role-based navigation
│   ├── Modal.jsx             # Dialogs and confirmation modals
│   ├── Pagination.jsx        # Table pagination controls
│   ├── ReportDialog.jsx      # Candidate report submission dialog
│   ├── RiskRuler.jsx         # 0–100 calibrated risk ruler
│   ├── RuleCard.jsx          # Rule explanation cards
│   ├── StatusBadge.jsx       # Status badges (Pending, Legit, Suspicious, Fake)
│   ├── StatusFilter.jsx      # Status filter chips
│   └── WeeklyChart.jsx       # Interactive fake share weekly bar chart
├── context/
│   ├── AuthContext.jsx       # Authentication and active role state
│   └── ToastContext.jsx      # Feedback notifications
├── lib/
│   ├── fields.js             # Unified catalogue of coded values & fields
│   ├── filterParams.js       # Dashboard filter parameter normalization
│   ├── format.js             # Date, currency, risk, and status formatters
│   ├── parseStatus.js        # Status filter query parser
│   ├── postingPayload.js     # Form payload building & sanitization
│   ├── postingValidation.js  # Client-side form validation
│   ├── reportReasons.js      # Report reason definitions (1..4)
│   ├── rules.js              # ECA rules repository and evaluator
│   ├── statusMeta.js         # Status badge metadata
│   └── useAsync.js           # Async promise hook with error handling
├── pages/
│   ├── admin/                # Companies.jsx, Recruiters.jsx, Rules.jsx
│   ├── candidate/            # Browse.jsx, PostingView.jsx
│   ├── recruiter/            # Dashboard.jsx, Inbox.jsx, PostingDetail.jsx, PostingForm.jsx
│   └── Login.jsx             # Role-based demo login screen
├── App.jsx                   # Route definition & role guards
└── main.jsx                  # React application entry point
```
*Note: Backward-compatible shims are maintained in `frontend/shared/` and `frontend/T*.*` so that task-specific references remain valid.*

---

## 3. End-to-End Test Scenarios by User Story

### US1: Relational Database Schema & Seeding (MUST - Persistence - Sprint 1)
- **Goal**: Database holds Company, JobPosting, Salary, Fee, Content indicators, Recruiter, Candidate, IT_Admin, Report, Classification_Result, Escalation, and ECA_Rule tables.
- **Verification**:
  ```bash
  python backend/init_db.py
  ```
  Expected: All 13 tables created and seeded with 12 postings, 10 companies, recruiters, candidates, and 12 rules.

---

### US2: Posting Service Endpoints & Indicators (MUST - Backend - Sprint 1)
- **Goal**: Insert, display, and remove job postings, plus fetch indicators.
- **Test via Curl**:
  ```bash
  # 1. Fetch posting #1
  curl -s http://127.0.0.1:5000/api/postings/1

  # 2. Fetch salary indicators for posting #1
  curl -s http://127.0.0.1:5000/api/postings/1/salary

  # 3. Fetch fee indicators for posting #1
  curl -s http://127.0.0.1:5000/api/postings/1/fee

  # 4. Fetch content indicators for posting #1
  curl -s http://127.0.0.1:5000/api/postings/1/content
  ```
- **Expected Outcome**: HTTP 200 with JSON objects containing clean indicators.

---

### US3: ToCheck ECA Rules R1 to R8 (MUST - Backend - Sprint 1)
- **Goal**: Evaluate ECA rules against a posting and update its status and risk score.
- **Test via Curl**:
  ```bash
  # Post check request for posting #6 (Data Entry Clerk, currently Pending)
  curl -s -X POST http://127.0.0.1:5000/api/postings/6/check \
    -H "Content-Type: application/json" \
    -d "{\"recruiterId\": 1}"
  ```
- **Expected Outcome**: HTTP 200 with `{ "status": ..., "risk_score": ..., "rule_id": ... }`.

---

### US4: Recruiter Posting Form (MUST - Frontend - Sprint 1)
- **Goal**: Recruiter fills form with posting, company, salary, fee, and content indicators with live client-side validation and rule preview.
- **UI Test**:
  1. Open `http://localhost:5173`.
  2. Select **Recruiter** role and click **Sign in**.
  3. Click **New posting** in the top navigation bar.
  4. Fill out the form fields:
     - Select an existing company (e.g. `TechNova Solutions`) or toggle to create a new company.
     - Enter Title: `Senior Python Engineer`, Location: `Algiers`, Employment Type: `Full-time`.
     - In **Salary**, observe that toggling "Salary hidden" enables/disables Min/Max amount fields.
     - In **Fee**, observe that choosing "Fee requested: No" neutralizes Fee Type and Advance Payment.
     - Look at the **Live Rule Preview** panel on the right side: as you modify fields, it shows which ECA rule will fire before submission.
  5. Click **Save and check**.
  6. The app submits `POST /api/postings` and immediately navigates to the result case file.

---

### US5: Classification Result & Fired Rule Explanation (MUST - Frontend - Sprint 1)
- **Goal**: Display classification verdict, risk ruler (0–100), fired rule, condition ledger, and human override option.
- **UI Test**:
  1. Navigate to `/recruiter/postings/3` (Posting #3: "Work from home - earn 5000 USD per week!!!").
  2. Verify:
     - Status Badge shows **Fake (F)**.
     - Risk Ruler displays **95 / 100** in red.
     - Fired rule highlights **R1: Fake_NoProfile_Salary_Fee**.
     - Condition Ledger lists all conditions:
       - `Company.HasProfile = 0` (Matched)
       - `Salary.SalaryLevel = 2` (Matched)
       - `Fee.FeeRequested = 1` (Matched)
  3. Click **Manual adjudication**: change status to `S` (Suspicious) with a reason and submit.
  4. Verify the classification history tab logs the override.

---

### US6: Candidate Report & Escalation Queue (MUST - Backend - Sprint 2)
- **Goal**: Candidates report postings. When reports reach threshold (>= 3: R9 fires, >= 5: R10 fires), posting escalates to recruiter queue.
- **Test via Curl**:
  ```bash
  # Candidate 4 reports posting 11 (which already has 2 reports in seed data)
  curl -s -X POST http://127.0.0.1:5000/api/reports \
    -H "Content-Type: application/json" \
    -d "{\"postingId\": 11, \"candidateId\": 4, \"reason\": 1}"
  ```
- **Expected Outcome**:
  - Response shows `fired_rules: ["R9"]` and `escalated: true`.
  - Fetching `GET /api/escalations` lists posting 11 with `priority: "normal"`.
  ```bash
  # Check escalation queue
  curl -s http://127.0.0.1:5000/api/escalations
  ```

---

### US7: Candidate Search & Status Badges (MUST - Frontend - Sprint 2)
- **Goal**: Candidates search postings, filter by status badges, and report suspicious postings.
- **UI Test**:
  1. Log out or switch role to **Candidate**.
  2. Navigate to **Browse postings** (`/candidate/browse`).
  3. Type `Remote` in the search box: table filters in real time.
  4. Click the status filter chips: **Legit**, **Suspicious**, **Fake**, or **All**.
  5. Click the **Report** button on any posting card.
  6. Select a reason (Fee requested, Fake/misleading, Sensitive data requested, Other) and submit.
  7. Confirm the success notification displays the report effect (e.g. "Report registered — escalated to recruiters").

---

### US8: IT Admin Management & Repeat-Offender Blacklist (KANN - Backend - Sprint 2)
- **Goal**: Manage companies, recruiters, and blacklist repeat offenders (R11 & R12).
- **Test via Curl**:
  ```bash
  # Check company 5 (Global Opportunities Ltd has 3 fake postings in seed data)
  curl -s -X POST http://127.0.0.1:5000/api/companies/5/check
  ```
- **Expected Outcome**:
  - Response shows `changed: true`, `blacklisted: true`, `fired_rules: ["R11"]`.
  ```bash
  # Now insert a posting for the newly blacklisted company 5 -> R12 rejects it immediately
  curl -s -X POST http://127.0.0.1:5000/api/postings \
    -H "Content-Type: application/json" \
    -d "{
      \"company_id\": 5,
      \"title\": \"Urgent Hospitality Staff\",
      \"location\": \"Dubai\",
      \"employment_type\": 0
    }"
  ```
- **Expected Outcome**: HTTP 201 with `status: "F"`, `risk_score: 100` (Rule R12 fired on insertion).

---

### US9: ECA Rules in Database & History (KANN - Persistence - Sprint 2)
- **Goal**: View dynamic rules repository without redeploying.
- **Test via Curl**:
  ```bash
  curl -s http://127.0.0.1:5000/api/rules
  ```
- **UI Test**:
  1. Sign in as **Admin**.
  2. Navigate to `/admin/rules`.
  3. Inspect all 12 rules, their triggers, conditions, and actions rendered dynamically from the database.

---

### US10: Recruiter Trend Dashboard (WISH - Frontend - Sprint 2)
- **Goal**: Recruiter dashboard with weekly fake share chart, per-company bars, and KPI panels.
- **UI Test**:
  1. Sign in as **Recruiter**.
  2. Click **Dashboard** in navigation (`/recruiter/dashboard`).
  3. Inspect KPIs: Total postings, Fake share %, Suspicious share %, Pending review, 7-day reports, Average risk.
  4. Inspect the **Weekly fake-share chart**: hover over bars to inspect week dates, fake count, and percentages.
  5. Use the **Period selector** (Last 4 weeks, Last 9 weeks, Last 16 weeks, Last 26 weeks).
  6. Use the **Company filter** to view statistics scoped to a single company.

---

## 4. ECA Rule Verification Matrix (R1 to R12)

| Rule | Trigger | Conditions | Expected Action | Test Case |
|---|---|---|---|---|
| **R1** | `R.ToCheck(P)` | `C.HasProfile = 0` AND `S.SalaryLevel = 2` AND `F.FeeRequested = 1` | Status: `F`, Score: `95` | Posting #3 |
| **R2** | `R.ToCheck(P)` | `F.FeeRequested = 1` AND `F.PaymentBeforeInterview = 1` | Status: `F`, Score: `90` | Posting #7 |
| **R3** | `R.ToCheck(P)` | `K.PersonalInfoRequested = 2` AND `C.WebsiteVerified = 0` | Status: `F`, Score: `90` | Posting #8 |
| **R4** | `R.ToCheck(P)` | `S.SalaryLevel >= 1` AND `K.DescriptionQuality = 0` AND `K.UrgencyLanguage >= 1` | Status: `S`, Score: `65` | Posting #9 |
| **R5** | `R.ToCheck(P)` | `C.HasProfile = 0` AND `K.ContactChannel >= 1` | Status: `S`, Score: `60` | Posting #4 |
| **R6** | `R.ToCheck(P)` | `C.AgeYears < 1` AND `C.PostingsLast24h > 20` | Status: `S`, Score: `70` | Posting #6 |
| **R7** | `R.ToCheck(P)` | `S.SalaryHidden = 1` AND `K.ContactChannel = 2` AND `F.FeeRequested = 0` | Status: `S`, Score: `55` | Posting #10 |
| **R8** | `R.ToCheck(P)` | `C.HasProfile = 1` AND `C.WebsiteVerified = 1` AND `S.SalaryLevel = 0` AND `F.FeeRequested = 0` AND `K.PersonalInfoRequested = 0` | Status: `L`, Score: `10` | Posting #1, #2 |
| **R9** | `Cd.Report(P)` | `Rp.CountReports(P) >= 3` AND `P.Status != 'F'` | Status: `S`, Escalate: `normal` | Report Posting #11 (3rd report) |
| **R10**| `Cd.Report(P)` | `Rp.CountReports(P) >= 5` | Risk: `+20`, Escalate: `high` | Report Posting #4 (5th report) |
| **R11**| `A.CheckCompany(C)`| `C.FakePostingsCount >= 3` | `C.Blacklisted(1)` | Company #5 (FakePostingsCount = 3) |
| **R12**| `P.Insert(Infos)` | `C.Blacklisted = 1` | Status: `F`, Score: `100` | Insert Posting for Company #6 |

---

## 5. Automated Verification Script

To run an automated integration verification of all backend endpoints and rule evaluation in a single command:

```powershell
python -c "
import sys; sys.path.insert(0, 'backend')
from run import app
client = app.test_client()
print('Testing Endpoints...')
assert client.get('/api/auth/accounts').status_code == 200, 'Auth accounts failed'
assert client.get('/api/postings').status_code == 200, 'Postings list failed'
assert client.get('/api/companies').status_code == 200, 'Companies list failed'
assert client.get('/api/stats/summary').status_code == 200, 'Stats summary failed'
assert client.get('/api/rules').status_code == 200, 'Rules list failed'
print('All critical API endpoints verified successfully!')
"
```
