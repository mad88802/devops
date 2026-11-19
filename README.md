# T2.2 Validation of coded values (Appendix A.4)
Branch: `T2.2-validation-coded-values`

validation.py: validate_posting / validate_salary / validate_fee / validate_content.
- Codes: SalaryLevel 0-2, SalaryHidden 0-1, FeeRequested 0-1, FeeType 0-3, PaymentBeforeInterview 0-1,
  PersonalInfoRequested 0-2, UrgencyLanguage 0-2, DescriptionQuality 0-2, ContactChannel 0-2, EmploymentType 0-2.
- Real JSON integers only (true/false and "1" rejected); all errors returned at once as HTTP 422.
- Business rules: no fee => fee_type 0 and no prepayment; fee => fee_type 1-3; salary_min <= salary_max;
  hidden salary => amounts/currency null; status / risk_score cannot be set by the client.
