import { Country } from "src/app/shared/enums/states";
import { Organization } from "src/app/shared/models/organization.model";
import { SkillCategory } from "src/app/shared/models/skill-category.model";
import { Skill, SkillFilters } from "src/app/shared/models/skill.model";
import { Department, DepartmentFilter } from '@shared/models/department.model';
import { Location, LocationFilter } from '@shared/models/location.model';
import { Region } from '@shared/models/region.model';
import { CredentialType } from '@shared/models/credential-type.model';
import { Credential, CredentialFilter } from '@shared/models/credential.model';
import { CredentialSkillGroup } from '@shared/models/skill-group.model';
import { OrganizationSettingFilter, OrganizationSettingsPost } from '@shared/models/organization-settings.model';
import { ExportPayload } from "@shared/models/export.model";

export class SetGeneralStatesByCountry {
  static readonly type = '[organizationManagement] Set General States By Country';
  constructor(public payload: Country) { }
}

export class SetBillingStatesByCountry {
  static readonly type = '[organizationManagement] Set Billing States By Country';
  constructor(public payload: Country) { }
}

export class SaveOrganization {
  static readonly type = '[organizationManagement] Save Organization';
  constructor(public payload: Organization) { }
}

export class SaveOrganizationSucceeded {
  static readonly type = '[organizationManagement] Save Organization Succeeded';
  constructor(public payload: Organization) { }
}

export class UploadOrganizationLogo {
  static readonly type = '[organizationManagement] Upload Organization Logo';
  constructor(public file: Blob, public businessUnitId: number) { }
}

export class GetOrganizationLogo {
  static readonly type = '[organizationManagement] Get Organization Logo';
  constructor(public payload: number) { }
}

export class GetOrganizationLogoSucceeded {
  static readonly type = '[organizationManagement] Get Organization Logo Succeeded';
  constructor(public payload: Blob) { }
}

export class GetOrganizationById {
  static readonly type = '[organizationManagement] Get Organization by ID';
  constructor(public payload: number) { }
}

export class GetOrganizationByIdSucceeded {
  static readonly type = '[organizationManagement] Get Organization by ID Succeeded';
  constructor(public payload: Organization) { }
}

export class SaveDepartment {
  static readonly type = '[organizationManagement] Create Department';
  constructor(public payload: Department, public filters?: DepartmentFilter) { }
}

export class GetDepartmentsByLocationId {
  static readonly type = '[organizationManagement] Get The List Of Departments by locationId';
  constructor(public locationId?: number, public filters?: DepartmentFilter) { }
}

export class UpdateDepartment {
  static readonly type = '[organizationManagement] Update Department';
  constructor(public department: Department, public filters?: DepartmentFilter) { }
}

export class DeleteDepartmentById {
  static readonly type = '[organizationManagement] Delete Department by id';
  constructor(public department: Department, public filters?: DepartmentFilter) { }
}

export class GetRegions {
  static readonly type = '[organizationManagement] Get The List Of Regions';
  constructor() { }
}

export class SaveRegion {
  static readonly type = '[organizationManagement] Create Region';
  constructor(public region: Region) { }
}

export class UpdateRegion {
  static readonly type = '[organizationManagement] Update Region';
  constructor(public region: Region) { }
}

export class DeleteRegionById {
  static readonly type = '[organizationManagement] Delete Region by id';
  constructor(public regionId: number) { }
}

export class GetLocationsByOrganizationId {
  static readonly type = '[organizationManagement] Get The List Of Locations by organizationId';
  constructor(public organizationId: number) { }
}

export class GetLocationsByRegionId {
  static readonly type = '[organizationManagement] Get The List Of Locations by regionId';
  constructor(public regionId: number, public filters?: LocationFilter) { }
}

export class GetLocationById {
  static readonly type = '[organizationManagement] Get The Location by id';
  constructor(public locationId: number) { }
}

export class SaveLocation {
  static readonly type = '[organizationManagement] Create Location';
  constructor(public location: Location, public regionId: number, public filters?: LocationFilter) { }
}

export class UpdateLocation {
  static readonly type = '[organizationManagement] Update Location';
  constructor(public location: Location, public regionId: number, public filters?: LocationFilter) { }
}

export class DeleteLocationById {
  static readonly type = '[organizationManagement] Delete Location by id';
  constructor(public locationId: number, public regionId: number, public filters?: LocationFilter) { }
}

export class GetBusinessUnitList {
  static readonly type = '[organizationManagement] Get The List Of Business Units';
  constructor() { }
}

export class SetDirtyState {
  static readonly type = '[organizationManagement] Set Dirty State Of The Form';
  constructor(public payload: boolean) { }
}

export class SetImportFileDialogState {
  static readonly type = '[organizationManagement] Set Import file dialog State';
  constructor(public payload: boolean) { }
}

export class GetMasterSkillsByPage {
  static readonly type = '[organizationManagement] Get Master Skills by Page';
  constructor(public pageNumber: number, public pageSize: number) { }
}

export class GetSkillsCategoriesByPage {
  static readonly type = '[organizationManagement] Get Skills Categories by Page';
  constructor(public pageNumber: number, public pageSize: number) { }
}

export class GetMasterSkillsByOrganization {
  static readonly type = '[organizationManagement] Get Master Skills by Organization';
  constructor() { }
}

export class GetAllSkillsCategories {
  static readonly type = '[organizationManagement] Get All Skills Categories';
  constructor() { }
}

export class SaveSkillsCategory {
  static readonly type = '[organizationManagement] Save Skills Category';
  constructor(public payload: SkillCategory) { }
}

export class SaveSkillsCategorySucceeded {
  static readonly type = '[organizationManagement] Save Skills Category Succeeded';
  constructor(public payload: SkillCategory) { }
}

export class RemoveSkillsCategory {
  static readonly type = '[organizationManagement] Remove Skills Category';
  constructor(public payload: SkillCategory) { }
}

export class SaveMasterSkill {
  static readonly type = '[organizationManagement] Save Master Skill';
  constructor(public payload: Skill) { }
}

export class RemoveMasterSkill {
  static readonly type = '[organizationManagement] Remove Master Skill';
  constructor(public payload: Skill) { }
}

export class SaveMasterSkillSucceeded {
  static readonly type = '[organizationManagement] Save Master Skill Succeeded';
  constructor(public payload: Skill) { }
}

export class RemoveMasterSkillSucceeded {
  static readonly type = '[organizationManagement] Remove Master Skill by ID Succeeded';
  constructor() { }
}

export class RemoveSkillsCategorySucceeded {
  static readonly type = '[organizationManagement] Remove Skill Category by ID Succeeded';
  constructor() { }
}

export class GetAssignedSkillsByPage {
  static readonly type = '[organizationManagement] Get Assigned Skills by Page';
  constructor(public pageNumber: number, public pageSize: number, public filters: SkillFilters) { }
}

export class SaveAssignedSkill {
  static readonly type = '[organizationManagement] Save Assigned Skill';
  constructor(public payload: Skill) { }
}

export class SaveAssignedSkillSucceeded {
  static readonly type = '[organizationManagement] Save Assigned Skill Succeeded';
  constructor(public payload: Skill) { }
}

export class RemoveAssignedSkill {
  static readonly type = '[organizationManagement] Remove Assigned Skill';
  constructor(public payload: Skill) { }
}

export class RemoveAssignedSkillSucceeded {
  static readonly type = '[organizationManagement] Remove Assigned Skill by ID Succeeded';
  constructor() { }
}

export class GetCredentialTypes {
  static readonly type = '[organizationManagement] Get Credential Types';
  constructor() { }
}

export class GetCredentialTypeById {
  static readonly type = '[organizationManagement] Get Credential Type by ID';
  constructor(public payload: CredentialType) { }
}

export class SaveCredentialType {
  static readonly type = '[organizationManagement] Save Credential Type';
  constructor(public payload: CredentialType) { }
}

export class RemoveCredentialType {
  static readonly type = '[organizationManagement] Remove Credential Type by ID';
  constructor(public payload: CredentialType) { }
}

export class UpdateCredentialType {
  static readonly type = '[organizationManagement] Update Credential Type';
  constructor(public payload: CredentialType) { }
}

export class GetCredential {
  static readonly type = '[organizationManagement] Get Credential list';
  constructor(public payload?: CredentialFilter) { }
}

export class GetCredentialById {
  static readonly type = '[organizationManagement] Get Credential by ID';
  constructor(public payload: Credential) { }
}

export class SaveCredential {
  static readonly type = '[organizationManagement] Save Credential';
  constructor(public payload: Credential) { }
}

export class SaveCredentialSucceeded {
  static readonly type = '[organizationManagement] Save Credential Succeeded';
  constructor(public payload: Credential) {}
}

export class RemoveCredential {
  static readonly type = '[organizationManagement] Remove Credential by ID';
  constructor(public payload: Credential) { }
}

export class GetAllSkills {
  static readonly type = '[organizationManagement] Get All Skills';
  constructor() {}
}

export class GetCredentialSkillGroup {
  static readonly type = '[organizationManagement] Get Credential Skill Group';
  constructor() {}
}

export class SaveUpdateCredentialSkillGroup {
  static readonly type = '[organizationManagement] Save/Update Credential Skill Group';
  constructor(public payload: CredentialSkillGroup) { }
}

export class RemoveCredentialSkillGroup {
  static readonly type = '[organizationManagement] Remove Credential Skill Group';
  constructor(public payload: CredentialSkillGroup) { }
}

export class GetOrganizationSettings {
  static readonly type = '[organizationManagement] Get Organization Settings';
  constructor(public filters?: OrganizationSettingFilter) {}
}

export class SaveOrganizationSettings {
  static readonly type = '[organizationManagement] Save Organization Settings';
  constructor(public organizationSettings: OrganizationSettingsPost) { }
}

export class ClearDepartmentList {
  static readonly type = '[organizationManagement] Clear Department list';
  constructor() { }
}

export class ClearLocationList {
  static readonly type = '[organizationManagement] Clear Location list';
  constructor() { }
}

export class ExportLocations {
  static readonly type = '[organizationManagement] Export Location list';
  constructor(public payload: ExportPayload) { }
}

export class ExportDepartments {
  static readonly type = '[organizationManagement] Export Department list';
  constructor(public payload: ExportPayload) { }
}

export class ExportSkills {
  static readonly type = '[organizationManagement] Export Skill list';
  constructor(public payload: ExportPayload) { }
}

export class GetSkillDataSources {
  static readonly type = '[organizationManagement] Get Skill Data Sources';
  constructor() { }
}

export class GetAllOrganizationSkills {
  static readonly type = '[organizationManagement] Get All Organization Skills';
  constructor() { }
}

export class GetLocationFilterOptions {
  static readonly type = '[organizationManagement] Get Location Filter Options';
  constructor(public payload: number) { }
}

export class GetDepartmentFilterOptions {
  static readonly type = '[organizationManagement] Get Department Filter Options';
  constructor(public payload: number) { }
}

export class GetOrganizationSettingsFilterOptions {
  static readonly type = '[organizationManagement] Get Organization Settings Filter Options';
  constructor() { }
}
