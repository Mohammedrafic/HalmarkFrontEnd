import { FilteredItem } from '@shared/models/filter.model';
import type { PanelModel } from '@syncfusion/ej2-angular-layouts';
import { TimeSelectionEnum } from '../enums/time-selection.enum';
import { DashboardFiltersModel } from '../models/dashboard-filters.model';

const dashboardStatePrefix: string = '[dashboard]';

export class GetDashboardData {
  static readonly type = `${dashboardStatePrefix} Get Dashboard Data`;
}

export class SaveDashboard {
  static readonly type = `${dashboardStatePrefix} Save Dashboard`;
  constructor(public payload: PanelModel[]) {}
}

export class SetPanels {
  static readonly type = `${dashboardStatePrefix} Set panels`;
  constructor(public payload: PanelModel[]) {}
}

export class ResetState {
  static readonly type = `${dashboardStatePrefix} Reset state`;
}

export class IsMobile {
  static readonly type = `${dashboardStatePrefix} Is Mobile`;
  constructor(public payload: boolean) {}
}

export class SetFilteredItems {
  static readonly type = `${dashboardStatePrefix} Set Filtered Items`;
  constructor(public payload: FilteredItem[]) {}
}

export class SwitchMonthWeekTimeSelection {
  static readonly type = `${dashboardStatePrefix} Switch Month Week Time Selection`;
  constructor(public payload: TimeSelectionEnum) {}
}

export class GetAllSkills {
  static readonly type = `${dashboardStatePrefix} Get All Skills`;
}

export class GetOrganizationSkills {
  static readonly type = `${dashboardStatePrefix} Get Organization Skill`;
  constructor(public readonly businessUnitId?: number ) {}
}

export class ToggleQuickOrderDialog {
  static readonly type = `${dashboardStatePrefix} Toggle Quick Order Dialog`;
  constructor(public readonly isOpen: boolean ) {}
}
