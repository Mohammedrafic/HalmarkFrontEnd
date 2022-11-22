export interface TierDTO {
  organizationTierId: number;
  regionIds: number[];
  locationIds: number[];
  departmentIds: number[];
  name?: string;
  hours?: number;
  associateOrganizationId?: number;
  forceUpsert?: boolean;
}

export interface TierConfig {
  regions: number[];
  locations: number[];
  departments: number[];
}
