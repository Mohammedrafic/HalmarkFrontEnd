export enum ApplicantStatus {
  NotApplied = 5,
  Applied = 10,
  Shortlisted = 20,
  PreOfferCustom = 30,
  Withdraw = 35,
  Offered = 40,
  BillRatePending = 44,
  OfferedBR = 47,
  Accepted = 50,
  OnBoarded = 60,
  End = 70,
  Offboard = 90,
  Rejected = 100,
  Cancelled = 110,
}

export enum CandidatStatus {
  'Not Applied' = 5,
  Applied = 10,
  Shortlisted = 20,
  'Pre Offer Custom' = 30,
  Withdraw = 35,
  Offered = 40,
  BillRatePending = 44,
  OfferedBR = 47,
  Accepted = 50,
  'OnBoard' = 60,
  End = 70,
  Offboard = 90,
  Rejected = 100,
  Cancelled = 110,
  CustomStatus = 30,
}

export enum ApplicantStatusIRP{
  OnBoard = "Onboard",
  Accepted = "Accepted"
}

export enum ConfigurationValues {
  Accept = "Accept",
  Apply = "Apply"
}

export enum InProgress{
  IN_PROGRESS = 'In progress'
}