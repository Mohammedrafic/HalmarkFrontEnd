import { ListOfSkills } from '@shared/models/skill.model';
import { ApplicantStatus } from '@shared/enums/applicant-status.enum';
import { ExportedFileType } from '@shared/enums/exported-file-type';
import { CandidateStatus } from '@shared/enums/status';
import { PageOfCollections } from '@shared/models/page.model';
import { CredentialType } from '@shared/models/credential-type.model';

export type CandidateRow = {
  candidateProfileId: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  profileStatus: CandidateStatus;
  lastAssignmentEndDate: string | null;
  candidateProfileRegions: string[] | Array<string | { regionDescription: string }>;
  candidateProfileSkills: string[] | Array<string | { skillDescription: string }>;
  photoId: string | null;
  candidateStatus: ApplicantStatus;
};

export type IRPCandidate = {
  id?: number;
  hasRedFlag: boolean;
  redFlagDescription: string;
  employeeId: number
  firstName: string;
  middleName: string;
  lastName: string;
  employeeStatus: string;
  primarySkillName: string;
  employeeSkills: string[];
  employeeWorkCommitments?:string;
  hireDate: string;
  orgOrientation: string;
  employeeSourceId?: string;
  source?: string;
  recruiter?: string
  employeeStatusId?:number;
  locationName?:string;
  departmentId?:number;
  departmentName?:string;
  sourceId?:number;
  recruiterId?:number

}

export interface CandidateListRequest {
  orderBy?: string;
  pageNumber?: number;
  pageSize?: number;
  profileStatuses: CandidateStatus[];
  skillsIds: number[];
  regionsNames: string[];
  tab: number;
  firstNamePattern: string | null;
  lastNamePattern: string | null;
  includeDeployedCandidates: boolean;
  candidateId?: string | null;
  locationIds?: number[];
  departmentIds?: number[];
  primarySkillIds?: number[];
  secondarySkillIds?: number[];
  hireDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  credType? : number[];
  ids?:number[];
  expiry? : {
    startDate?: string | null;
    endDate?: string | null;
    type: number[] | null;
  };
  ShowNoWorkCommitmentOnly?: boolean;
}

export type CandidateListFilters = {
  firstNamePattern?: string | null;
  lastNamePattern?: string | null;
  profileStatuses?: CandidateStatus[];
  skillsIds?: number[];
  regionsNames?: string[];
  tab?: number;
  candidateId?: string | null;
  locationIds?: number[];
  departmentIds?: number[];
  primarySkillIds?: number[];
  secondarySkillIds?: number[];
  hireDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  credType? : number[];
  orderBy?: string;
  expiry? : {
    startDate?: string | null;
    endDate?: string | null;
    type: number[];
  };
};

export interface FilterColumn {
  dataSource: Array<any>;
  type: number;
  valueField: string;
  valueId: string;
  valueType: number;
}

export interface CandidateNameFilterColumn {
  valueType: number;
  type: number;
}

export interface CandidateListFiltersColumn {
  profileStatuses: FilterColumn;
  skillsIds?: FilterColumn;
  regionsNames?: FilterColumn;
  firstNamePattern?: CandidateNameFilterColumn;
  lastNamePattern?: CandidateNameFilterColumn;
  candidateId?: CandidateNameFilterColumn;
  locationIds?: FilterColumn;
  departmentIds?: FilterColumn;
  primarySkillIds?: FilterColumn;
  secondarySkillIds?: FilterColumn;
  hireDate?: CandidateNameFilterColumn;
  startDate?: CandidateNameFilterColumn;
  endDate?: CandidateNameFilterColumn;
  credType? : FilterColumn;
}

export type CandidateListExport = {
  filterQuery: CandidateListRequest;
  exportFileType: ExportedFileType;
  properties: string[];
  filename: string;
};

export type CandidateList = PageOfCollections<CandidateRow>;

export type IRPCandidateList = PageOfCollections<IRPCandidate>;


export interface CandidatePagingState {
  pageNumber: number;
  pageSize: number;
}

export type CandidateListTableState = CandidateListFilters & CandidatePagingState & { includeDeployedCandidates: boolean; };

export interface CandidateListStateModel {
  isCandidateLoading: boolean;
  candidateList: CandidateList | null;
  IRPCandidateList: IRPCandidateList | null;
  listOfSkills: ListOfSkills[] | null;
  listOfRegions: string[] | null;
  tableState: CandidateListTableState | null;
  listOfCredentialTypes: CredentialType[] | null;
}

export interface EmployeeInactivateData {
  inactivationDate: string;
  inactivationReasonId: number;
  createReplacement: boolean;
}

export interface InactivateEmployeeDto {
  id: number;
  inactivationDate: string;
  inactivationReasonId: number;
  createReplacement: boolean;
}

export interface InactivationEvent {
  id: number | null;
  hireDate: string | null;
}
