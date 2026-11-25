# Fake Job Posting Detection (DEVOPS_G12_WEB-APP)

Azure DevOps Lab Project (ING4-DS) - **Team 12**
- **PO:** BENKRAOUDA Mohamed Amine
- **DEV1:** CHALABI Imad
- **DEV2:** BOUYAHIA Iheb Seif Eddine
- **TESTER:** BENA OUMEUR Abderrahim

---

## 🏛️ Project Architecture

The project follows a 3-tier ECA-driven (Event-Condition-Action) architecture:
1. **Presentation Level (Frontend)**: Web interface for Recruiters, Candidates, and IT Admins.
2. **Business-Logic Level (Backend)**: Flask REST API and ECA rule engine for diagnostic checking of job postings.
3. **Persistence Level (Database)**: Relational schema storing companies, recruiters, postings, indicators, and classification history.

```
DEVOPS_G12_WEB-APP/
├── backend/                  # Business Logic Layer (Flask API & ECA Rule Engine)
│   ├── app/
│   │   ├── engine/           # ECA Rule evaluator, repository & rules.json
│   │   ├── routes/           # REST API endpoints (postings, check, company)
│   │   ├── services/         # Business services (posting, indicator, company, tocheck)
│   │   ├── db.py             # Database connection manager (MySQL & SQLite)
│   │   ├── errors.py         # Custom application exceptions
│   │   ├── validation.py     # Coded value validation & rules
│   │   └── __init__.py       # Flask app factory
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Server entry point
├── database/                 # Persistence Layer
│   ├── schema.sql            # Relational database schema & constraints
│   ├── seed.sql              # Initial seed data for testing
│   └── schema_erd.png        # Entity-Relationship diagram
├── docs/                     # Project Documentation & Specifications
│   ├── 1_class_diagram.png   # UML Class Model
│   ├── 2_eca_architecture.png# ECA-driven 3-tier architecture
│   ├── 3_sequence_R1.png     # Sequence diagram for rule evaluation
│   └── LAB_PRJ12_Fake_Job_Posting_Detection.pdf # Project requirements
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- MySQL / MariaDB (or SQLite for local/testing)

### 2. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Database Setup
Execute `database/schema.sql` followed by `database/seed.sql` on your MySQL instance:
```bash
mysql -u root -p < ../database/schema.sql
mysql -u root -p < ../database/seed.sql
```

### 4. Running the API
From within `backend/`:
```bash
python run.py
```
The server will start at `http://127.0.0.1:5000/`.

---

## 📡 API Endpoints (Sprint 1)
- `POST /api/postings`: Create a new job posting with indicators (status starts as `P`).
- `GET /api/postings/<id>`: Retrieve posting details, company, and indicators.
- `DELETE /api/postings/<id>`: Remove a posting.
- `GET /api/postings/<id>/salary`: Retrieve salary indicators.
- `GET /api/postings/<id>/fee`: Retrieve fee indicators.
- `GET /api/postings/<id>/content`: Retrieve content indicators.
- `GET /api/companies/<id>`: Retrieve company details.
- `POST /api/postings/<id>/check`: Trigger ECA rule evaluation (`ToCheck`) to classify posting as Legit (`L`), Suspicious (`S`), or Fake (`F`).
