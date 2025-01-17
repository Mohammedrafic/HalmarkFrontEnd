import { PageOfCollections } from "@shared/models/page.model";

export interface CandidateWorkCommitment {
  id?: number;
  employeeId?: number;
  workCommitmentIds: number[];
  name?: string;
  regions?: string[];
  locations?: string[];
  regionIds?: number[];
  locationIds: number[];
  startDate: string | Date;
  endDate: string | Date;
  jobCode: string;
  payRate: number;
  minWorkExperience: number;
  availRequirement: number;
  schedulePeriod: number;
  holiday: number;
  criticalOrder: number;
  comment: string;
  created?: string | Date;
  isActive: boolean;
  numberOfOrganizationWorkCommitments: number;
  createReplacement?: boolean;
  isInUse: boolean;
}

export type CandidateWorkCommitmentsPage = PageOfCollections<CandidateWorkCommitment>;

export interface WorkCommitmentSetup {
  startDate: string;
  endDate: string | null;
  regions: string[];
  locations: string[];
  workCommitmentId: number,
  employeeWorkCommitmentId: number,
}
