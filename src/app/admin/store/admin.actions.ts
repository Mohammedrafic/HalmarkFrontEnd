import { Country } from 'src/app/shared/enums/states';
import { Organization } from 'src/app/shared/models/organization.model';
import { SkillCategory } from 'src/app/shared/models/skill-category.model';
import { Skill } from 'src/app/shared/models/skill.model';

export class SetGeneralStatesByCountry {
  static readonly type = '[admin] Set General States By Country';
  constructor(public payload: Country) { }
}

export class SetBillingStatesByCountry {
  static readonly type = '[admin] Set Billing States By Country';
  constructor(public payload: Country) { }
}

export class SaveOrganization {
  static readonly type = '[admin] Save Organization';
  constructor(public payload: Organization) { }
}

export class SaveOrganizationSucceeded {
  static readonly type = '[admin] Save Organization Succeeded';
  constructor(public payload: Organization) { }
}

export class UploadOrganizationLogo {
  static readonly type = '[admin] Upload Organization Logo';
  constructor(public file: Blob, public businessUnitId: number) { }
}

export class GetOrganizationLogo {
  static readonly type = '[admin] Get Organization Logo';
  constructor(public payload: number) { }
}

export class GetOrganizationLogoSucceeded {
  static readonly type = '[admin] Get Organization Logo Succeeded';
  constructor(public payload: Blob) { }
}

export class GetOrganizationById {
  static readonly type = '[admin] Get Organization by ID';
  constructor(public payload: number) { }
}

export class GetOrganizationByIdSucceeded {
  static readonly type = '[admin] Get Organization by ID Succeeded';
  constructor(public payload: Organization) { }
}

export class GetOrganizationsByPage {
  static readonly type = '[admin] Get Organizations by Page';
  constructor(public pageNumber: number, public pageSize: number) { }
}

export class GetBusinessUnitList {
  static readonly type = '[admin] Get The List Of Business Units';
  constructor() { }
}

export class SetDirtyState {
  static readonly type = '[admin] Set Dirty State Of The Form';
  constructor(public payload: boolean) { }
}

export class SetImportFileDialogState {
  static readonly type = '[admin] Set Import file dialog State';
  constructor(public payload: boolean) { }
}

export class GetMasterSkillsByPage {
  static readonly type = '[admin] Get Master Skills by Page';
  constructor(public pageNumber: number, public pageSize: number) { }
}

export class GetSkillsCategoriesByPage {
  static readonly type = '[admin] Get Skills Categories by Page';
  constructor(public pageNumber: number, public pageSize: number) { }
}

export class GetAllSkillsCategories {
  static readonly type = '[admin] Get All Skills Categories';
  constructor() { }
}

export class SaveSkillsCategory {
  static readonly type = '[admin] Save Skills Category';
  constructor(public payload: SkillCategory) { }
}

export class SaveSkillsCategorySucceeded {
  static readonly type = '[admin] Save Skills Category Succeeded';
  constructor(public payload: SkillCategory) { }
}

export class RemoveSkillsCategory {
  static readonly type = '[admin] Remove Skills Category';
  constructor(public payload: SkillCategory) { }
}

export class SaveMasterSkill {
  static readonly type = '[admin] Save Master Skill';
  constructor(public payload: Skill) { }
}

export class RemoveMasterSkill {
  static readonly type = '[admin] Remove Master Skill';
  constructor(public payload: Skill) { }
}

export class SaveMasterSkillSucceeded {
  static readonly type = '[admin] Save Master Skill Succeeded';
  constructor(public payload: Skill) { }
}

export class RemoveMasterSkillSucceeded {
  static readonly type = '[admin] Remove Master Skill by ID Succeeded';
  constructor() { }
}

export class RemoveSkillsCategorySucceeded {
  static readonly type = '[admin] Remove Skill Category by ID Succeeded';
  constructor() { }
}

export class GetAllSkills {
  static readonly type = '[admin] Get All Skills';
  constructor() {}
}
