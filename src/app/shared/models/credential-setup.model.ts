import { CredentialSkillGroup } from '@shared/models/skill-group.model';
import { PageOfCollections } from './page.model';

export class CredentialSetupGet {
  masterCredentialId: number;
  mappingId?: number;
  credentialType: string;
  description: string;
  isActive?: boolean;
  reqSubmission?: boolean;
  reqOnboard?: boolean;
  inactiveDate?: string;
  comments?: string;
  includeInIRP?: boolean;
  includeInVMS?: boolean;
  irpComment?: string;
  irpComments?: string;
}

export class CredentialSetupPost {
  mappingId: number;
  masterCredentialId: number;
  isActive: boolean;
  reqSubmission: boolean;
  reqOnboard: boolean;
  inactiveDate: string;
  comments: string;
}

export class CredentialSetupMappingPost {
  credentionSetupMappingId?: number;
  regionIds?: number[];
  locationIds?: number[];
  departmentIds?: number[];
  skillGroupIds?: number[];
  credentials: CredentialSetupDetails[];
  forceUpsert?: boolean;
}

export class CredentialSetupDetails {
  masterCredentialId: number;
  optional?: boolean;
  reqSubmission?: boolean;
  reqOnboard?: boolean;
  inactiveDate?: string;
  comments?: string;
  irpComment?: string;
}

export interface CredentialsSelectedItem {
  masterCredentialId: number;
  comments: string;
  isActive: boolean;
  reqSubmission: boolean;
  reqOnboard: boolean;
  inactiveDate: string;
}

export class SaveUpdatedCredentialSetupDetailIds {
  createdIds: number[];
}

export interface CredentialSetupFilterDto {
  regionId?: number;
  locationId?: number;
  departmentId?: number;
  skillGroupId?: number;
  skillId?: number;
  includeInIRP?: boolean;
  includeInVMS?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export class CredentialSetupFilterGet {
  mappingId: number;
  regionName?: string;
  regionId?: number;
  locationName?: string;
  locationId?: number;
  departmentName?: string;
  departmentId?: number;
  skillGroups?: CredentialSkillGroup[];
  includeInIRP?: boolean;
  includeInVMS?: boolean;
}

export type CredentialSetupPage = PageOfCollections<CredentialSetupFilterGet>;
