import { ItemModel } from '@syncfusion/ej2-splitbuttons/src/common/common-model';

import { ExportType, HourOccupationType, TIMETHEETS_STATUSES } from '../enums';
import { CandidateHoursAndMilesData, TabConfig, TabCountConfig } from '../interface';


export const TAB_ADMIN_TIMESHEETS: TabConfig[] = [
  {
    title: 'All Timesheets',
    value: [],
  },
  {
    title: 'Pending Approval',
    value: [2, 3],
  },
  {
    title: 'Missing',
    value: [4],
  },
  {
    title: 'Rejected',
    value: [5],
  }
];

export const MapTimesheetsStatuses: Map<TIMETHEETS_STATUSES, number> = new Map()
  .set(TIMETHEETS_STATUSES.INCOMPLETE, 1)
  .set(TIMETHEETS_STATUSES.PENDING_APPROVE, 2)
  .set(TIMETHEETS_STATUSES.PENDING_APPROVE_ASTERIX, 3)
  .set(TIMETHEETS_STATUSES.MISSING, 4)
  .set(TIMETHEETS_STATUSES.REJECTED, 5)
  .set(TIMETHEETS_STATUSES.APPROVED, 6);

export const TimesheetExportOptions: ItemModel[] = [
  { text: ExportType.Excel_file, id: '0' },
  { text: ExportType.CSV_file, id: '1' },
  { text: ExportType.Custom, id: '2' }
];

export const MokTabsCounts: TabCountConfig = {
  pending: 0,
  missing: 0,
  rejected: 0,
};

export const UNIT_ORGANIZATIONS_FIELDS = {
  text: 'name',
  value: 'id',
};

export const profileDetailsHoursChartColorsMap: Record<HourOccupationType, string> = {
  [HourOccupationType.OnCall]: '#3E7FFF',
  [HourOccupationType.Callback]: '#518CFF',
  [HourOccupationType.Regular]: '#6499FF',
  [HourOccupationType.Holiday]: '#9EBFFF',
  [HourOccupationType.Preceptor]: '#D8E5FF',
  [HourOccupationType.Orientation]: '#FFFFFF',
};

export const MockCandidateHoursAndMilesData: CandidateHoursAndMilesData = {
  hours: [
    {
      type: HourOccupationType.OnCall,
      week: 32.47,
      cumulative: 52.47,
    },
    {
      type: HourOccupationType.Callback,
      week: 2.5,
      cumulative: 42.5,
    },
    {
      type: HourOccupationType.Regular,
      week: 36,
      cumulative: 76,
    },
    {
      type: HourOccupationType.Holiday,
      week: 36,
      cumulative: 76,
    },
    {
      type: HourOccupationType.Preceptor,
      week: 36,
      cumulative: 66,
    },
    {
      type: HourOccupationType.Orientation,
      week: 36,
      cumulative: 36,
    }
  ],
  miles: {
    weekMiles: 60,
    cumulativeMiles: 120,
    weekCharge: 120,
    cumulativeCharge: 240,
  }
};
