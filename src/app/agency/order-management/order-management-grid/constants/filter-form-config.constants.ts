import { AgencyOrderManagementTabs } from "@shared/enums/order-management-tabs.enum";
import { CommonFormConfig } from "@shared/models/common-form-config.model";

export const GetAgencyFilterFormConfig = (tab: AgencyOrderManagementTabs): CommonFormConfig[] => {
  switch (tab) {
    case AgencyOrderManagementTabs.AllAgencies:
      return AllOrdersFilterFormConfig;
    case AgencyOrderManagementTabs.PerDiem:
      return PerDiemFilterFormConfig;
    case AgencyOrderManagementTabs.PermPlacement:
      return PermPlacementFilterFormConfig;
    case AgencyOrderManagementTabs.ReOrders:
      return ReOrderFilterFormConfig;
    default:
      return AllOrdersFilterFormConfig;
  }
};

const CommonFields: CommonFormConfig[] = [
  { field: 'orderPublicId' },
  { field: 'organizationIds' },
  { field: 'regionIds' },
  { field: 'locationIds' },
  { field: 'departmentsIds' },
  { field: 'skillIds' },
  { field: 'candidateStatuses' },
  { field: 'orderStatuses' },
  { field: 'candidatesCountFrom' },
  { field: 'candidatesCountTo' },
  { field: 'jobTitle' },
  { field: 'creationDateFrom' },
  { field: 'creationDateTo' },
  { field: 'distributedOnFrom' },
  { field: 'distributedOnTo' },
  { field: 'candidateName' },
  { field: 'projectTypeIds' },
  { field: 'projectNameIds' },
  { field: 'poNumberIds' },
];

const AllOrdersFilterFormConfig: CommonFormConfig[] = [
  ...CommonFields,
  { field: 'orderTypes' },
  { field: 'billRateFrom' },
  { field: 'billRateTo' },
  { field: 'openPositions' },
  { field: 'jobStartDate' },
  { field: 'jobEndDate' },
];

const PerDiemFilterFormConfig: CommonFormConfig[] = [
  ...CommonFields,
  { field: 'openPositions' },
];

const PermPlacementFilterFormConfig: CommonFormConfig[] = [
  ...CommonFields,
  { field: 'annualSalaryRangeFrom' },
  { field: 'annualSalaryRangeTo' },
  { field: 'jobStartDate' },
];

const ReOrderFilterFormConfig: CommonFormConfig[] = [
  ...CommonFields,
  { field: 'jobStartDate' },
  { field: 'billRateFrom' },
  { field: 'billRateTo' },
  { field: 'openPositions' },
];