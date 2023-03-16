import { FieldType } from '@core/enums';
import { PenaltyPayload } from '@shared/models/penalty.model';
import { RejectReason } from '@shared/models/reject-reason.model';
import { ReasonFormType, ReasonsNavigationTabs } from '../enums';

export interface ReasonsFormTypesMap {
  [index: number]: ReasonFormType;
}

export interface UnavailabilityValue {
  id?: number | null;
  reason: string;
  description: string;
  calculateTowardsWeeklyHours: boolean;
  eligibleToBeScheduled: boolean;
  visibleForIRPCandidates: boolean;
}


export interface Closurevalue {
  id?: number | null;
  reason: string;
  includeInIRP: boolean;
  includeInVMS: boolean;
}


export type ReasonValueType = RejectReason | UnavailabilityValue;

export interface SaveReasonParams {
  selectedTab: ReasonsNavigationTabs;
  editMode: boolean;
  formValue: ReasonValueType | PenaltyPayload;
  formType: ReasonFormType;
  allRegionsSelected?: boolean;
  allLocationsSelected?: boolean;
  forceUpsert?: boolean;
}

export interface ReasonFormConfig {
  field: string;
  title: string;
  required: boolean;
  fieldType: FieldType;
  checkBoxes?: ReasonCheckBoxGroup[];
}

export interface ReasonCheckBoxGroup {
  field: string;
  title: string;
}

export interface ReasonFormConfigMap {
  [ReasonFormType.DefaultReason]: ReasonFormConfig[];
  [ReasonFormType.Unavailability]: ReasonFormConfig[];
  [ReasonFormType.PenaltyReason]: null;
  [ReasonFormType.RequisitionReason] : ReasonFormConfig[];
  [ReasonFormType.ClosureReason] : ReasonFormConfig[];
}