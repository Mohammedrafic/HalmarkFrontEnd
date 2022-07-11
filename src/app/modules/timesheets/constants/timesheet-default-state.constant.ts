import { TimesheetsModel } from '../store/model/timesheets.model';
import { DefaultFilterColumns, DefaultFiltersState } from './timesheets-table.constant';

export const DefaultTimesheetState: TimesheetsModel = {
  timesheets: null,
  timesheetsFilters: DefaultFiltersState,
  tabCounts: null,
  timeSheetRecords: {
    timeRecords: [],
    miles: [],
    expenses: [],
  },
  candidateInfo: null,
  candidateChartData: null,
  candidateAttachments: {
    attachments: [],
  },
  isTimeSheetOpen: false,
  selectedTimeSheetId: 0,
  billRateTypes: [],
  costCenterOptions: [],
  isAddDialogOpen: false,
  timesheetsFiltersColumns: DefaultFilterColumns,
}
