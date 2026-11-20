/**
 * Deterministic sample data for the demo.
 *
 * Postings are not given a status by hand: every one is classified by the rule
 * engine at seed time, so the dataset can never contradict R1–R12. The mix is
 * chosen to exercise all eight recruiter rules, plus a company that is eligible
 * for R11 but has not been blacklisted yet, and a blacklisted company whose new
 * postings are rejected on insertion by R12.
 */
import { ALL_RULES, evaluateCheck } from '../shared/rules.js'

const DAY = 24 * 60 * 60 * 1000

function isoDaysAgo(days) {
  return new Date(Date.now() - days * DAY).toISOString().slice(0, 10)
}

function isoHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

const COMPANIES = [
  // id, name, country, industry, ageYears, hasProfile, websiteVerified, postingsLast24h, blacklisted
  [1, 'Northbridge Talent FZE', 'AE', 'Staffing', 0, 0, 0, 42, 0],
  [2, 'Meridian Systems', 'FR', 'Software', 12, 1, 1, 3, 0],
  [3, 'Atlas Workforce', 'DZ', 'Recruitment', 5, 1, 1, 6, 0],
  [4, 'Rubicon Global Hire', 'GB', 'HR Services', 1, 0, 0, 28, 0],
  [5, 'Cedar & Co', 'CA', 'Consulting', 8, 1, 1, 2, 0],
  [6, 'Novacore Labs', 'DE', 'Software', 3, 1, 1, 4, 0],
  [7, 'FastTrack Careers', 'US', 'Staffing', 0, 0, 0, 61, 0],
  [8, 'Oran Telecom Group', 'DZ', 'Telecom', 15, 1, 1, 1, 0],
  [9, 'Blue Mesa Ventures', 'US', 'Finance', 2, 1, 0, 9, 0],
  [10, 'Sahara Logistics', 'DZ', 'Logistics', 9, 1, 1, 2, 0],
  [11, 'TopHire Solutions', 'IN', 'Staffing', 0, 0, 0, 55, 0],
  [12, 'Vertex Recruitment', 'AE', 'Recruitment', 6, 1, 1, 5, 0],
  [13, 'Northgate Holdings', 'CY', 'Finance', 0, 0, 0, 77, 1],
]

/**
 * [companyId, title, location, employmentType, daysAgo, salary, fee, content, description]
 * salary  = [min, max, currency, level, hidden]
 * fee     = [requested, type, paymentBeforeInterview]
 * content = [personalInfoRequested, urgencyLanguage, descriptionQuality, contactChannel]
 */
const POSTINGS = [
  [
    1,
    'Senior Data Analyst',
    'Dubai, AE',
    0,
    5,
    [9000, 16000, 'USD', 2, 0],
    [1, 2, 1],
    [1, 2, 1, 1],
    'Fully remote analytical role. Immediate start available. A registration fee is required to activate your candidate file before the interview.',
  ],
  [
    1,
    'Remote Data Entry Clerk',
    'Remote',
    1,
    12,
    [2500, 3200, 'USD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 2],
    'Enter records into our client database. Contact the coordinator on WhatsApp only, we do not use email for applications.',
  ],
  [
    1,
    'Warehouse Supervisor',
    'Sharjah, AE',
    0,
    19,
    [1800, 2400, 'USD', 1, 0],
    [0, 0, 0],
    [0, 0, 1, 0],
    'Supervise a team of twelve pickers on the night shift. Forklift licence preferred. Reporting to the operations manager.',
  ],
  [
    1,
    'Customer Support Agent (Night)',
    'Dubai, AE',
    1,
    26,
    [4000, 5200, 'USD', 1, 0],
    [0, 0, 0],
    [0, 1, 0, 0],
    'Urgent need, pay well above market for a support role. No experience necessary, apply fast.',
  ],
  [
    1,
    'HR Assistant',
    'Abu Dhabi, AE',
    0,
    33,
    [3000, 3600, 'USD', 1, 0],
    [1, 1, 1],
    [1, 1, 1, 1],
    'Assist the HR team with onboarding files. A one-time training fee applies to all new joiners.',
  ],
  [
    7,
    'Junior Accountant',
    'Houston, TX',
    0,
    41,
    [3500, 4200, 'USD', 1, 0],
    [1, 2, 1],
    [1, 1, 1, 1],
    'Entry level accounting position. A registration fee is payable before the interview to reserve your slot.',
  ],
  [
    7,
    'Bilingual Receptionist',
    'Miami, FL',
    0,
    47,
    [1600, 1900, 'USD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Front desk role for a busy practice. English and Spanish required. Monday to Friday, 9 to 5.',
  ],
  [
    7,
    'Sales Representative',
    'Austin, TX',
    0,
    54,
    [5000, 9000, 'USD', 1, 0],
    [0, 0, 0],
    [0, 2, 0, 0],
    'Uncapped commission, earn six figures in your first year. Act now, only three places left.',
  ],
  [
    7,
    'Graphic Designer',
    'Remote, US',
    2,
    60,
    [12000, 18000, 'USD', 2, 0],
    [1, 3, 1],
    [1, 1, 1, 0],
    'Design marketing assets for our portfolio. Equipment and visa fee must be settled before onboarding.',
  ],
  [
    7,
    'Bookkeeping Assistant',
    'Dallas, TX',
    0,
    2,
    [2000, 2500, 'USD', 0, 0],
    [0, 0, 0],
    [2, 0, 1, 0],
    'Maintain supplier ledgers. Please send a copy of your ID and card details to verify your identity before the interview.',
  ],
  [
    11,
    'Software Engineer (Remote)',
    'Remote',
    0,
    3,
    [15000, 25000, 'USD', 2, 0],
    [1, 2, 1],
    [2, 2, 0, 2],
    'Long term remote contract. Send a copy of your passport and bank details with the registration fee to secure the role. Start immediately.',
  ],
  [
    11,
    'Data Entry Operator',
    'Mumbai, IN',
    1,
    16,
    [600, 900, 'USD', 0, 0],
    [0, 0, 0],
    [1, 1, 2, 2],
    'Simple data entry work from home. Message us on Telegram to begin, do not call the office.',
  ],
  [
    11,
    'QA Tester',
    'Remote, IN',
    0,
    30,
    [2000, 2600, 'USD', 0, 0],
    [1, 1, 1],
    [1, 1, 1, 0],
    'Manual testing of our web platform. A short training fee is charged before the offer letter.',
  ],
  [
    11,
    'Project Coordinator',
    'Remote',
    2,
    44,
    [4500, 6000, 'USD', 2, 0],
    [0, 0, 0],
    [0, 1, 0, 0],
    'Coordinate delivery across three teams. Very urgent hire, apply today, interviews tonight.',
  ],
  [
    4,
    'Customer Success Manager',
    'London, GB',
    0,
    9,
    [3000, 3800, 'GBP', 1, 0],
    [0, 0, 0],
    [0, 0, 2, 1],
    'Own a portfolio of forty accounts. Apply through our recruitment inbox.',
  ],
  [
    4,
    'Office Manager',
    'Manchester, GB',
    0,
    22,
    [2200, 3000, 'GBP', 0, 0],
    [0, 0, 0],
    [2, 0, 1, 0],
    'Run the day to day office. Send us a copy of your ID and a bank statement to be considered.',
  ],
  [
    4,
    'Telemarketer',
    'Remote, GB',
    1,
    36,
    [null, null, 'GBP', 0, 1],
    [0, 0, 0],
    [0, 0, 1, 2],
    'Outbound calls from home. Salary discussed later. Contact only through the messaging app.',
  ],
  [
    4,
    'Operations Assistant',
    'Birmingham, GB',
    0,
    51,
    [2400, 2900, 'GBP', 1, 0],
    [0, 0, 0],
    [1, 0, 2, 0],
    'Support the operations team with scheduling and supplier follow up. Permanent contract.',
  ],
  [
    9,
    'Financial Analyst',
    'New York, NY',
    0,
    2,
    [6000, 7500, 'USD', 1, 0],
    [0, 0, 0],
    [2, 1, 1, 0],
    'Build the quarterly forecast. Please attach a copy of your ID and card details for payroll pre-registration.',
  ],
  [
    9,
    'Compliance Officer',
    'New York, NY',
    0,
    15,
    [7000, 9000, 'USD', 1, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Own the AML programme for a boutique advisory firm. Five years of experience required.',
  ],
  [
    9,
    'Risk Intern',
    'Boston, MA',
    1,
    28,
    [3500, 4500, 'USD', 1, 0],
    [0, 0, 0],
    [0, 2, 0, 0],
    'Six month internship, barely any detail available. Apply now, we are closing this today.',
  ],
  [
    9,
    'Marketing Intern',
    'Boston, MA',
    1,
    50,
    [800, 1200, 'USD', 0, 0],
    [0, 0, 0],
    [2, 1, 1, 1],
    'Support the marketing team. Send your ID and account details to complete the application.',
  ],
  [
    2,
    'Backend Engineer (Java)',
    'Lyon, FR',
    0,
    1,
    [45000, 55000, 'EUR', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Join the payments platform team. Spring Boot, PostgreSQL, Kafka. Full benefits and remote friendly.',
  ],
  [
    2,
    'DevOps Engineer',
    'Paris, FR',
    0,
    10,
    [50000, 62000, 'EUR', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 1],
    'Own our Kubernetes platform and CI pipelines. Apply through our careers page.',
  ],
  [
    2,
    'Product Owner',
    'Remote, FR',
    2,
    24,
    [null, null, 'EUR', 0, 1],
    [0, 0, 0],
    [0, 0, 2, 2],
    'Drive the roadmap for our data products. Salary not disclosed. Contact the hiring manager on WhatsApp.',
  ],
  [
    5,
    'Management Consultant',
    'Toronto, CA',
    0,
    6,
    [85000, 95000, 'CAD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Strategy engagements for public sector clients. Structured career path, three years of experience.',
  ],
  [
    5,
    'Research Associate',
    'Toronto, CA',
    0,
    20,
    [62000, 71000, 'CAD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Quantitative research for our policy practice. Masters degree required.',
  ],
  [
    6,
    'Machine Learning Engineer',
    'Berlin, DE',
    0,
    8,
    [70000, 85000, 'EUR', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Train and deploy ranking models. Python, PyTorch, MLflow. Hybrid role in Berlin.',
  ],
  [
    6,
    'Frontend Developer (React)',
    'Remote, DE',
    2,
    29,
    [60000, 72000, 'EUR', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 1],
    'Build our design system in React and TypeScript. Apply on our website.',
  ],
  [
    3,
    'Comptable Senior',
    'Oran, DZ',
    0,
    13,
    [180000, 240000, 'DZD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Tenue de la comptabilité générale et analytique. Cinq ans d’expérience exigés.',
  ],
  [
    3,
    'Ingénieur Réseau',
    'Alger, DZ',
    0,
    34,
    [160000, 210000, 'DZD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Administration de l’infrastructure réseau. Cisco, pare-feu, supervision.',
  ],
  [
    8,
    'Technicien Télécom',
    'Oran, DZ',
    0,
    4,
    [90000, 120000, 'DZD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Maintenance des équipements de transmission. Habilitation électrique appréciée.',
  ],
  [
    8,
    'Chef de Projet',
    'Oran, DZ',
    0,
    27,
    [250000, 320000, 'DZD', 1, 0],
    [0, 0, 0],
    [1, 0, 1, 0],
    'Pilotage des projets de déploiement fibre. Une copie de la pièce d’identité est demandée dès la candidature.',
  ],
  [
    10,
    'Dispatcher',
    'Ghardaia, DZ',
    0,
    11,
    [70000, 90000, 'DZD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Planification des tournées de transport. Maîtrise d’Excel requise.',
  ],
  [
    12,
    'Recruitment Consultant',
    'Dubai, AE',
    0,
    18,
    [7000, 9000, 'USD', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Manage a portfolio of technology clients. Uncapped bonus, three years of agency experience.',
  ],
  [
    13,
    'Investment Analyst',
    'Limassol, CY',
    0,
    7,
    [8000, 12000, 'USD', 0, 0],
    [1, 2, 1],
    [1, 1, 1, 1],
    'Analyse mid cap opportunities. Registration fee required before the first interview.',
  ],
  [
    13,
    'Portfolio Assistant',
    'Limassol, CY',
    1,
    23,
    [null, null, 'USD', 1, 1],
    [1, 1, 0],
    [0, 0, 1, 2],
    'Support the portfolio team. Contact us on the messaging app; a training fee applies.',
  ],
  [
    13,
    'Junior Trader',
    'Remote',
    2,
    37,
    [5000, 7000, 'USD', 2, 0],
    [1, 3, 1],
    [2, 2, 0, 1],
    'Fast paced trading desk. Send your bank details and equipment fee to reserve your seat.',
  ],
  [
    13,
    'Client Relations',
    'Limassol, CY',
    0,
    52,
    [4000, 5000, 'USD', 0, 0],
    [1, 1, 1],
    [0, 0, 1, 1],
    'Look after existing clients. Induction training fee applies to all new hires.',
  ],
  [
    2,
    'Cloud Architect',
    'Paris, FR',
    0,
    0,
    [70000, 88000, 'EUR', 0, 0],
    [0, 0, 0],
    [0, 0, 2, 0],
    'Design multi region AWS architectures for our logistics customers. Senior role, hybrid.',
  ],
  [
    7,
    'Night Shift Packer',
    'Memphis, TN',
    1,
    0,
    [1100, 1400, 'USD', 0, 0],
    [0, 0, 0],
    [0, 1, 1, 2],
    'Pack orders on the night line. Message us on WhatsApp for the address.',
  ],
  [
    11,
    'Remote Recruiter',
    'Remote',
    2,
    1,
    [4000, 5000, 'USD', 1, 0],
    [0, 0, 0],
    [0, 2, 0, 0],
    'Recruit for overseas clients from home. Weekly pay, start this week, limited slots.',
  ],
  [
    4,
    'Photographer',
    'Remote, GB',
    2,
    4,
    [null, null, 'GBP', 0, 1],
    [0, 0, 0],
    [0, 0, 1, 2],
    'Shoot product photography for our catalogue. Salary on request. WhatsApp only.',
  ],
]

const RECRUITERS = [
  [1, 'Amine', 'Benkraouda', 'amine.benkraouda@usto-mb.dz', 'R'],
  [2, 'Imad', 'Chalabi', 'imad.chalabi@usto-mb.dz', 'R'],
  [3, 'Iheb', 'Bouyahia', 'iheb.bouyahia@usto-mb.dz', 'S'],
  [4, 'Abderrahim', 'Bena Oumeur', 'abderrahim.benaoumeur@usto-mb.dz', 'R'],
]

const CANDIDATES = [
  [1, 'Lina', 'Haddad', 'lina.haddad@mail.dz'],
  [2, 'Yacine', 'Belkacem', 'yacine.belkacem@mail.dz'],
  [3, 'Sara', 'Mansouri', 'sara.mansouri@mail.dz'],
  [4, 'Karim', 'Zerrouki', 'karim.zerrouki@mail.dz'],
  [5, 'Nour', 'Ait Ali', 'nour.aitali@mail.dz'],
]

const ADMINS = [[1, 'Nadia Cherif', 'nadia.cherif@usto-mb.dz']]

/** [posting title, hoursAgo, candidateId, reason] */
const REPORTS = [
  ['Operations Assistant', 30, 1, 2],
  ['Operations Assistant', 20, 2, 1],
  ['Operations Assistant', 9, 3, 4],
  ['Remote Data Entry Clerk', 96, 1, 3],
  ['Remote Data Entry Clerk', 72, 2, 4],
  ['Remote Data Entry Clerk', 48, 3, 2],
  ['Remote Data Entry Clerk', 26, 4, 1],
  ['Remote Data Entry Clerk', 5, 5, 4],
  ['Bilingual Receptionist', 60, 2, 2],
  ['Bilingual Receptionist', 34, 3, 4],
  ['Bilingual Receptionist', 12, 5, 3],
  ['Telemarketer', 70, 1, 4],
  ['Telemarketer', 52, 4, 2],
  ['Telemarketer', 40, 5, 1],
  ['Telemarketer', 18, 2, 4],
  ['Chef de Projet', 44, 3, 3],
  ['Chef de Projet', 22, 4, 4],
  ['Investment Analyst', 80, 5, 2],
  ['Investment Analyst', 36, 1, 4],
  ['Compliance Officer', 14, 2, 4],
]

export function buildSeed() {
  const tables = {
    company: [],
    jobPosting: [],
    salaryIndicators: [],
    feeIndicators: [],
    contentIndicators: [],
    report: [],
    classificationResult: [],
    recruiter: [],
    candidate: [],
    itAdmin: [],
    ecaRule: [],
  }

  for (const [id, name, country, industry, ageYears, hasProfile, websiteVerified, postingsLast24h, blacklisted] of COMPANIES) {
    tables.company.push({
      id,
      name,
      country,
      industry,
      ageYears,
      hasProfile,
      websiteVerified,
      postingsLast24h,
      fakePostingsCount: 0,
      blacklisted,
      createdAt: isoDaysAgo(365),
    })
  }

  for (const [id, name, surname, email, role] of RECRUITERS) {
    tables.recruiter.push({ id, name, surname, email, role })
  }
  for (const [id, name, surname, email] of CANDIDATES) {
    tables.candidate.push({ id, name, surname, email })
  }
  for (const [id, name, email] of ADMINS) {
    tables.itAdmin.push({ id, name, email })
  }

  // Rule repository (US9): the rules as stored rows, not as compiled code.
  for (const rule of ALL_RULES) {
    tables.ecaRule.push({
      ruleId: rule.code,
      name: rule.name,
      group: rule.group,
      priority: rule.priority,
      trigger: rule.trigger,
      participant: rule.participant,
      conditions: rule.conditions,
      actions: rule.actions,
      score: rule.score,
      enabled: 1,
      updatedAt: isoDaysAgo(30),
    })
  }

  // Postings, classified by the engine rather than declared by hand.
  POSTINGS.forEach((row, index) => {
    const [companyId, title, location, employmentType, daysAgo, salary, fee, content, description] = row
    const id = index + 1
    const company = tables.company.find((c) => c.id === companyId)

    tables.jobPosting.push({
      id,
      companyId,
      title,
      description,
      location,
      employmentType,
      postedDate: isoDaysAgo(daysAgo),
      status: 'P',
      riskScore: 0,
    })
    tables.salaryIndicators.push({
      postingId: id,
      salaryMin: salary[0],
      salaryMax: salary[1],
      currency: salary[2],
      salaryLevel: salary[3],
      salaryHidden: salary[4],
    })
    tables.feeIndicators.push({
      postingId: id,
      feeRequested: fee[0],
      feeType: fee[1],
      paymentBeforeInterview: fee[2],
    })
    tables.contentIndicators.push({
      postingId: id,
      personalInfoRequested: content[0],
      urgencyLanguage: content[1],
      descriptionQuality: content[2],
      contactChannel: content[3],
    })

    const posting = tables.jobPosting[index]
    const facts = {
      company: {
        hasProfile: company.hasProfile,
        websiteVerified: company.websiteVerified,
        blacklisted: company.blacklisted,
        ageYears: company.ageYears,
        postingsLast24h: company.postingsLast24h,
        fakePostingsCount: company.fakePostingsCount,
      },
      salary: { salaryLevel: salary[3], salaryHidden: salary[4] },
      fee: { feeRequested: fee[0], feeType: fee[1], paymentBeforeInterview: fee[2] },
      content: {
        personalInfoRequested: content[0],
        urgencyLanguage: content[1],
        descriptionQuality: content[2],
        contactChannel: content[3],
      },
      posting: { status: 'P', riskScore: 0 },
      reports: { count: 0 },
    }

    // R12 applies first: a blacklisted company's posting enters as Fake.
    if (company.blacklisted === 1) {
      posting.status = 'F'
      posting.riskScore = 100
      tables.classificationResult.push({
        id: tables.classificationResult.length + 1,
        postingId: id,
        recruiterId: null,
        label: 'F',
        score: 100,
        ruleId: 'R12',
        decisionDate: isoHoursAgo(daysAgo * 24 + 2),
        mode: 'auto',
        reason: null,
      })
      return
    }

    const result = evaluateCheck(facts)
    if (result.fired) {
      posting.status = result.status
      posting.riskScore = result.riskScore
      const recruiterId = 1 + (index % 3)
      tables.classificationResult.push({
        id: tables.classificationResult.length + 1,
        postingId: id,
        recruiterId,
        label: result.status,
        score: result.riskScore,
        ruleId: result.fired.code,
        decisionDate: isoHoursAgo(daysAgo * 24 + 3),
        mode: 'auto',
        reason: null,
      })
    }
  })

  // Candidate reports. R9 and R10 are applied exactly as the mock API does.
  let reportId = 1
  for (const [title, hoursAgo, candidateId, reason] of REPORTS) {
    const posting = tables.jobPosting.find((p) => p.title === title)
    if (!posting) continue
    tables.report.push({
      id: reportId++,
      postingId: posting.id,
      candidateId,
      reason,
      reportDate: isoHoursAgo(hoursAgo),
    })
  }

  for (const posting of tables.jobPosting) {
    const count = tables.report.filter((r) => r.postingId === posting.id).length
    if (count >= 3 && posting.status !== 'F') {
      // R9 — Escalate_Reported_Posting
      if (posting.status !== 'S') {
        posting.status = 'S'
        tables.classificationResult.push({
          id: tables.classificationResult.length + 1,
          postingId: posting.id,
          recruiterId: null,
          label: 'S',
          score: posting.riskScore,
          ruleId: 'R9',
          decisionDate: isoHoursAgo(8),
          mode: 'auto',
          reason: null,
        })
      }
    }
    if (count >= 5) {
      // R10 — Raise_Risk_On_Many_Reports
      posting.riskScore = Math.min(100, posting.riskScore + 20)
      tables.classificationResult.push({
        id: tables.classificationResult.length + 1,
        postingId: posting.id,
        recruiterId: null,
        label: posting.status,
        score: posting.riskScore,
        ruleId: 'R10',
        decisionDate: isoHoursAgo(5),
        mode: 'auto',
        reason: null,
      })
    }
  }

  // FakePostingsCount is derived, never typed in.
  for (const company of tables.company) {
    company.fakePostingsCount = tables.jobPosting.filter(
      (p) => p.companyId === company.id && p.status === 'F',
    ).length
  }

  return tables
}
