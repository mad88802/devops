USE jobwatch_test;
START TRANSACTION;

INSERT INTO it_admin (admin_id, name, email) VALUES
 (1, 'Nadia Belkacem', 'nadia.belkacem@jobwatch.dz');

INSERT INTO recruiter (recruiter_id, name, surname, email, role, admin_id) VALUES
 (1, 'Amel',  'Kaci',     'amel.kaci@jobwatch.dz',     'R', 1),
 (2, 'Yacine','Merabet',  'yacine.merabet@jobwatch.dz','S', 1);

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

COMMIT;
