# T3.2 Implement rules R1 to R8
Branch: `T3.2-rules-r1-r8`

engine/rules.json : the eight rules of Appendix A.5, all `at_trigger: ToCheck`.

| Rule | Under | Acting |
|---|---|---|
| R1 Fake_NoProfile_Salary_Fee | C.HasProfile=0, S.SalaryLevel=2, F.FeeRequested=1 | F, 95 |
| R2 Fake_PrepaidFee | F.FeeRequested=1, F.PaymentBeforeInterview=1 | F, 90 |
| R3 Fake_SensitiveData | K.PersonalInfoRequested=2, C.WebsiteVerified=0 | F, 90 |
| R4 Suspicious_TooGoodToBeTrue | S.SalaryLevel>=1, K.DescriptionQuality=0, K.UrgencyLanguage>=1 | S, 65 |
| R5 Suspicious_AnonymousContact | C.HasProfile=0, K.ContactChannel>=1 | S, 60 |
| R6 Suspicious_BulkPosting | C.AgeYears<1, C.PostingsLast24h>20 | S, 70 |
| R7 Suspicious_OffPlatformContact | S.SalaryHidden=1, K.ContactChannel=2, F.FeeRequested=0 | S, 55 |
| R8 Legit_Verified | C.HasProfile=1, C.WebsiteVerified=1, S.SalaryLevel=0, F.FeeRequested=0, K.PersonalInfoRequested=0 | L, 10 |

Rules are data, not code: changing a threshold needs no redeploy (file is reloaded on every check).
