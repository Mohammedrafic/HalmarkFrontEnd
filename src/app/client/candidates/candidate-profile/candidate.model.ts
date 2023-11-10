import { GeneralNotesModel } from '@client/candidates/candidate-profile/general-notes/general-notes.model';

export interface CandidateModel {
  id: number,
  employeeId: string,
  firstName: string,
  middleName: string,
  lastName: string,
  dob: Date,
  primarySkillId: number,
  secondarySkills: number[],
  classification: number,
  hireDate: Date | string,
  fte: number,
  profileStatus: number,
  hrCompanyCodeId: number,
  internalTransferId: number,
  orientationConfigurationId: number,
  organizationOrientationDate: Date,
  isContract: boolean,
  contractStartDate: Date,
  contractEndDate: Date,
  holdStartDate: Date | string,
  holdEndDate: Date | string,
  inactivationDate: string,
  inactivationReasonId: number,
  address1: string,
  state: string,
  city: string,
  zipCode: string,
  personalEmail: string,
  workEmail: string,
  phone1: string,
  phone2: string,
  professionalSummary: string,
  generalNotes: GeneralNotesModel[],
  isOnHoldSetManually: boolean,
  createReplacement?: boolean,
}
