import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { catchError, debounceTime, forkJoin, mergeMap, Observable, of,
  switchMap, tap, throttleTime, throwError } from 'rxjs';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { patch } from '@ngxs/store/operators';

import { downloadBlobFile } from '@shared/utils/file.utils';
import { MessageTypes } from '@shared/enums/message-types';
import { ExportedFileType } from '@shared/enums/exported-file-type';
import { DialogAction } from '@core/enums';
import { DataSourceItem, DropdownOption } from '@core/interface';

import { TimesheetsModel, TimeSheetsPage } from '../model/timesheets.model';
import { TimesheetsApiService } from '../../services/timesheets-api.service';
import { Timesheets } from '../actions/timesheets.actions';
import { TimesheetDetails } from '../actions/timesheet-details.actions';
import {
  RecordFields, TimesheetTargetStatus, TimesheetsTableFiltersColumns, FilteringOptionsFields
} from '../../enums';
import {
  AddSuccessMessage, DefaultFiltersState, DefaultTimesheetCollection, DefaultTimesheetState,
  filteringOptionsMapping, GetBydateErrMessage, PutSuccess, SavedFiltersParams } from '../../constants';
import {
  Attachment, CandidateHoursAndMilesData, CandidateInfo, CandidateMilesData, FilterColumns, TabCountConfig,
  Timesheet, TimesheetDetailsModel, TimesheetInvoice, TimesheetRecordsDto, TimesheetsFilterState, TimesheetStatistics,
  TimesheetsFilteringOptions } from '../../interface';
import { ShowToast } from '../../../../store/app.actions';
import { TimesheetDetailsApiService } from '../../services/timesheet-details-api.service';
import { reduceFiltersState } from '../../helpers';

@State<TimesheetsModel>({
  name: 'timesheets',
  defaults: DefaultTimesheetState,
})
@Injectable()
export class TimesheetsState {
  constructor(
    private timesheetsApiService: TimesheetsApiService,
    private timesheetDetailsApiService: TimesheetDetailsApiService,
    private store: Store,
  ) {}

  @Selector([TimesheetsState])
  static timesheets(state: TimesheetsModel): TimeSheetsPage | null {
    return state.timesheets;
  }

  @Selector([TimesheetsState])
  static timesheetsFilters(state: TimesheetsModel): TimesheetsFilterState | null {
    return state.timesheetsFilters;
  }

  @Selector([TimesheetsState])
  static timesheetsFiltersColumns(state: TimesheetsModel): FilterColumns {
    return state.timesheetsFiltersColumns;
  }

  @Selector([TimesheetsState])
  static isTimesheetOpen(state: TimesheetsModel): boolean {
    return state.isTimeSheetOpen;
  }

  @Selector([TimesheetsState])
  static selectedTimeSheet(state: TimesheetsModel): Timesheet | null {
    return state.selectedTimeSheet;
  }

  @Selector([TimesheetsState])
  static tabCounts(state: TimesheetsModel): TabCountConfig | null {
    return state.tabCounts;
  }

  @Selector([TimesheetsState])
  static tmesheetRecords(state: TimesheetsModel): TimesheetRecordsDto {
    return state.timeSheetRecords;
  }

  @Selector([TimesheetsState])
  static candidateInfo(state: TimesheetsModel): CandidateInfo | null {
    return state.candidateInfo;
  }

  @Selector([TimesheetsState])
  static candidateHoursAndMilesData(state: TimesheetsModel): CandidateHoursAndMilesData | null {
    return state.candidateHoursAndMilesData;
  }

  @Selector([TimesheetsState])
  static timeSheetAttachments(state: TimesheetsModel): Attachment[] {
    return state.candidateAttachments.attachments;
  }

  @Selector([TimesheetsState])
  static timeSheetInvoices(state: TimesheetsModel): TimesheetInvoice[] {
    return state.candidateInvoices;
  }

  @Selector([TimesheetsState])
  static billRateTypes(state: TimesheetsModel): unknown {
    return state.billRateTypes;
  }

  @Selector([TimesheetsState])
  static timesheetDetails(state: TimesheetsModel): TimesheetDetailsModel | null {
    return state.timesheetDetails;
  }

  @Selector([TimesheetsState])
  static timesheetDetailsMilesStatistics(state: TimesheetsModel): CandidateMilesData | null {
    const statistics: TimesheetStatistics | null = state?.timesheetDetails?.timesheetStatistic ?? null;
    const { weekMiles = 0, cumulativeMiles = 0, weekCharge = 0, cumulativeCharge = 0 } = statistics || {};

    return weekMiles || cumulativeMiles || weekCharge || cumulativeCharge ? {
      weekMiles,
      cumulativeMiles,
      weekCharge,
      cumulativeCharge
    } : null;
  }

  @Selector([TimesheetsState])
  static addDialogOpen(state: TimesheetsModel): { state: boolean, type: RecordFields, initDate: string } {
    return {
      state: state.isAddDialogOpen.action,
      type: state.isAddDialogOpen.dialogType,
      initDate: state.isAddDialogOpen.initTime,
    };
  }

  @Selector([TimesheetsState])
  static costCenters(state: TimesheetsModel): unknown {
    return state.costCenterOptions;
  }

  @Selector([TimesheetsState])
  static organizations(state: TimesheetsModel): DataSourceItem[] {
    return state.organizations;
  }

  @Selector([TimesheetsState])
  static selectedOrganization(state: TimesheetsModel): number {
    return state.selectedOrganizationId;
  }

  @Action(Timesheets.GetAll)
  GetTimesheets(
    { patchState, getState, dispatch }: StateContext<TimesheetsModel>,
  ): Observable<TimeSheetsPage> {
    patchState({
      timesheets: DefaultTimesheetCollection,
    });

    const filters = getState().timesheetsFilters || {};

    return this.timesheetsApiService.getTimesheets(filters)
      .pipe(
        tap((res: TimeSheetsPage) => {
          patchState({
            timesheets: res,
          });

          dispatch(new Timesheets.GetTabsCounts());
        })
      );
  }

  @Action(Timesheets.GetTabsCounts)
  GetTabsCounts(
    { patchState, getState }: StateContext<TimesheetsModel>,
  ): Observable<TabCountConfig> {
    const filters = getState().timesheetsFilters || {};

    return this.timesheetsApiService.getTabsCounts(filters)
      .pipe(
        tap((res: TabCountConfig) => {
          patchState({
            tabCounts: res,
          });
        }));
  }

  @Action(Timesheets.UpdateFiltersState)
  UpdateFiltersState(
    { setState, getState }: StateContext<TimesheetsModel>,
    { payload, saveStatuses, saveOrganizationId }: Timesheets.UpdateFiltersState,
  ): Observable<null> {
    const oldFilters: TimesheetsFilterState = getState().timesheetsFilters || DefaultFiltersState;
    let filters: TimesheetsFilterState = reduceFiltersState(oldFilters, SavedFiltersParams);
    filters = Object.assign({}, filters, payload);

    return of(null).pipe(
      throttleTime(100),
      tap(() =>
        setState(patch<TimesheetsModel>({
          timesheetsFilters: payload || saveStatuses ?
            filters :
            Object.assign({}, DefaultFiltersState, saveOrganizationId && {
              organizationId: oldFilters.organizationId,
            }),
        })
      )),
    );
  }

  @Action(Timesheets.ResetFiltersState)
  ResetFiltersState(
    { setState }: StateContext<TimesheetsModel>,
  ): Observable<null> {
    return of(null).pipe(
      throttleTime(100),
      tap(() => setState(patch<TimesheetsModel>({
        timesheetsFilters: null
      })))
    );
  }

  @Action(TimesheetDetails.GetTimesheetRecords)
  GetTimesheetRecords(
    { patchState }: StateContext<TimesheetsModel>,
    { id, orgId, isAgency }: TimesheetDetails.GetTimesheetRecords
  ): Observable<TimesheetRecordsDto> {
    return this.timesheetsApiService.getTimesheetRecords(id, orgId, isAgency)
    .pipe(
      tap((res) => {
        patchState({
          timeSheetRecords: res,
        });
      }),
    )
  }

  @Action(TimesheetDetails.PutTimesheetRecords)
  PutTimesheetRecords(
    ctx: StateContext<TimesheetsModel>,
    { body, isAgency }: TimesheetDetails.PutTimesheetRecords,
  ): Observable<TimesheetRecordsDto | void> {
    return this.timesheetsApiService.putTimesheetRecords(body)
    .pipe(
      switchMap(() => {
        const state = ctx.getState();
        const { id, organizationId } = state.selectedTimeSheet as Timesheet;
        /**
         * TODO: make all messages for toast in one constant.
         */
        this.store.dispatch(new ShowToast(MessageTypes.Success, PutSuccess.successMessage));
        this.store.dispatch(new Timesheets.GetTimesheetDetails(body.timesheetId, body.organizationId, isAgency));
        return this.store.dispatch(new TimesheetDetails.GetTimesheetRecords(id, organizationId, isAgency));
      }),
      catchError((err: HttpErrorResponse) => {
        return ctx.dispatch(new ShowToast(MessageTypes.Error, err.error.errors[''][0]))
      })
    )
  }

  @Action(Timesheets.DeleteProfileTimesheet)
  DeleteProfileTimesheet(
    ctx: StateContext<TimesheetsModel>,
    { profileId, profileTimesheetId }: Timesheets.DeleteProfileTimesheet
  ): Observable<null> {
    return this.timesheetsApiService.deleteProfileTimesheets(profileId, profileTimesheetId);
  }

  @Action(Timesheets.ToggleCandidateDialog)
  ToggleCandidateDialog({ patchState }: StateContext<TimesheetsModel>,
    { action, timesheet }: Timesheets.ToggleCandidateDialog): void {
    patchState({
      isTimeSheetOpen: action === DialogAction.Open,
      selectedTimeSheet: timesheet,
    });
  }

  @Action(Timesheets.ToggleTimesheetAddDialog)
  ToggleAddDialog({ patchState }: StateContext<TimesheetsModel>,
    { action, type, dateTime }: { action: DialogAction, type: RecordFields, dateTime: string}): void {
    patchState({
      isAddDialogOpen: {
        action: action === DialogAction.Open,
        dialogType: type,
        initTime: dateTime,
      },
    });
  }

  @Action(Timesheets.GetTimesheetDetails)
  GetTimesheetDetails(
    ctx: StateContext<TimesheetsModel>,
    { timesheetId, orgId, isAgency }: Timesheets.GetTimesheetDetails
  ): Observable<[void, void]> {
    return this.timesheetDetailsApiService.getTimesheetDetails(timesheetId, orgId, isAgency)
      .pipe(
        tap((res: TimesheetDetailsModel) => ctx.patchState({
            timesheetDetails: res,
          }),
        ),
        mergeMap((res) => forkJoin([
          ctx.dispatch(new TimesheetDetails.GetBillRates(res.jobId, orgId, isAgency)),
          ctx.dispatch(new TimesheetDetails.GetCostCenters(res.jobId, orgId, isAgency)),
        ])),
      );
  }

  @Action(TimesheetDetails.AgencySubmitTimesheet)
  SubmitTimesheet(
    { getState, patchState }: StateContext<TimesheetsModel>,
    { id, orgId }: TimesheetDetails.AgencySubmitTimesheet
  ): Observable<void> {
    return this.timesheetDetailsApiService.changeTimesheetStatus({
      timesheetId: id,
      organizationId: orgId,
      targetStatus: TimesheetTargetStatus.Submitted,
      reason: null,
    });
  }

  @Action(TimesheetDetails.OrganizationApproveTimesheet)
  ApproveTimesheet(
    { getState, patchState }: StateContext<TimesheetsModel>,
    { id, orgId }: TimesheetDetails.OrganizationApproveTimesheet
  ): Observable<void> {
    return this.timesheetDetailsApiService.changeTimesheetStatus({
      timesheetId: id,
      organizationId: orgId,
      targetStatus: TimesheetTargetStatus.Approved,
      reason: null,
    });
  }

  @Action(TimesheetDetails.ChangeTimesheetStatus)
  ChangeTimesheetStatus(
    {}: StateContext<TimesheetsModel>,
    { payload }: TimesheetDetails.ChangeTimesheetStatus
  ): Observable<void> {
    return this.timesheetDetailsApiService.changeTimesheetStatus(payload);
  }

  @Action(TimesheetDetails.Export)
  ExportTimesheetDetails({}: StateContext<TimesheetsModel>, { payload }: TimesheetDetails.Export): Observable<Blob> {
    return this.timesheetDetailsApiService.export(payload)
      .pipe(
        tap((file: Blob) => {
          downloadBlobFile(file, `empty.${payload.exportFileType === ExportedFileType.csv ? 'csv' : 'xlsx'}`);
        })
      );
  }

  @Action(TimesheetDetails.UploadFiles)
  TimesheetUploadAttachments(
    { getState, patchState }: StateContext<TimesheetsModel>,
    { payload: { timesheetId, files, organizationId } }: TimesheetDetails.UploadFiles
  ): Observable<void> {
    return (organizationId ? this.timesheetDetailsApiService.agencyUploadFiles(timesheetId, organizationId, files)
      : this.timesheetDetailsApiService.organizationUploadFiles(timesheetId, files));
  }

  @Action(TimesheetDetails.DeleteAttachment)
  DeleteTimesheetAttachment(
    { getState, patchState }: StateContext<TimesheetsModel>,
    { payload }: TimesheetDetails.DeleteAttachment
  ): Observable<void> {
    return this.timesheetDetailsApiService.deleteAttachment(payload)
      .pipe(
        catchError(() => this.store.dispatch(
          new ShowToast(MessageTypes.Error, 'File not found')
        ))
      );
  }

  @Action(Timesheets.GetFiltersDataSource)
  GetFiltersDataSource({ setState, getState }: StateContext<TimesheetsModel>): Observable<TimesheetsFilteringOptions> {
    const selectedOrganizationId = getState().selectedOrganizationId;

    return this.timesheetsApiService.getFiltersDataSource(selectedOrganizationId).pipe(
      tap((res) => {
        setState(patch({
          timesheetsFiltersColumns: patch(Object.keys(res).reduce((acc: any, key) => {
            acc[filteringOptionsMapping.get((key as FilteringOptionsFields)) as TimesheetsTableFiltersColumns] = patch({
              dataSource: res[key as FilteringOptionsFields],
            });
            return acc;
          }, {})),
        }));
      })
    );
  }

  @Action(Timesheets.SetFiltersDataSource)
  SetFiltersDataSource(
    { setState }: StateContext<TimesheetsModel>,
    { columnKey, dataSource }: Timesheets.SetFiltersDataSource
  ): Observable<null> {
    return of(null)
      .pipe(
        debounceTime(100),
        tap(() =>
          setState(patch({
            timesheetsFiltersColumns: patch({
              [columnKey]: patch({
                dataSource: dataSource,
              })
            })
          }))
        )
      );
  }

  @Action(TimesheetDetails.GetBillRates)
  GetBillRates({ patchState }: StateContext<TimesheetsModel>,
      { jobId, orgId, isAgency }: TimesheetDetails.GetBillRates): Observable<DropdownOption[]> {
      return this.timesheetsApiService.getCandidateBillRates(jobId, orgId, isAgency)
      .pipe(
        tap((res) => patchState({
          billRateTypes: res,
        })),
      );
    }

  @Action(TimesheetDetails.GetCostCenters)
  GetCostCenters({ patchState }: StateContext<TimesheetsModel>,
    { jobId, orgId, isAgency}: TimesheetDetails.GetCostCenters,
  ) {
    return this.timesheetsApiService.getCandidateCostCenters(jobId, orgId, isAgency)
    .pipe(
      tap((res) => patchState({
        costCenterOptions: res,
      })),
    );
  }

  @Action(TimesheetDetails.DownloadAttachment)
  DownloadAttachment(
    { }: StateContext<TimesheetsModel>,
    { payload }: TimesheetDetails.DownloadAttachment
  ): Observable<Blob> {
    return this.timesheetDetailsApiService.downloadAttachment(payload)
      .pipe(
        tap((file: Blob) => downloadBlobFile(file, payload.fileName)),
        catchError(() => this.store.dispatch(
          new ShowToast(MessageTypes.Error, 'File not found')
        ))
      )
  }

  @Action(TimesheetDetails.NoWorkPerformed)
  NoWorkPerformed(
    { }: StateContext<TimesheetsModel>,
    { noWorkPerformed, timesheetId, organizationId }: TimesheetDetails.NoWorkPerformed
  ): Observable<void> {
    return this.timesheetDetailsApiService.noWorkPerformed(noWorkPerformed, timesheetId, organizationId);
  }

  @Action(Timesheets.GetOrganizations)
  GetOrganizations({ patchState }: StateContext<TimesheetsModel>): Observable<DataSourceItem[]> {
    return this.timesheetsApiService.getOrganizations()
    .pipe(
      tap((organizations: DataSourceItem[]) => patchState({
        organizations,
        selectedOrganizationId: organizations[0]?.id,
      })),
    );
  }

  @Action(Timesheets.SelectOrganization)
  SelectOrganization(
    { patchState }: StateContext<TimesheetsModel>,
    { id }: Timesheets.SelectOrganization
  ): Observable<null> {
    return of(null).pipe(
      debounceTime(100),
      tap(() => patchState({
        selectedOrganizationId: id,
      }))
    );
  }

  @Action(Timesheets.BulkApprove)
  BulkApprove(
    { patchState }: StateContext<TimesheetsModel>,
    { timesheetIds }: Timesheets.BulkApprove
  ): Observable<void> | any {
    return this.timesheetsApiService.postBulkApprove(timesheetIds);
  }

  @Action(TimesheetDetails.AddTimesheetRecord)
  AddTimesheetRecord(ctx: StateContext<TimesheetsModel>,
    { body, isAgency }: TimesheetDetails.AddTimesheetRecord): Observable<void> {
    return this.timesheetsApiService.addTimesheetRecord(body)
    .pipe(
      tap(() => {
        const state = ctx.getState();
        const { id, organizationId } = state.selectedTimeSheet as Timesheet;

        ctx.dispatch([
          new ShowToast(MessageTypes.Success, AddSuccessMessage.successMessage),
          new Timesheets.GetTimesheetDetails(body.timesheetId, body.organizationId, isAgency),
          new TimesheetDetails.GetTimesheetRecords(id, organizationId, isAgency)
        ]);
      }),
      catchError((err: HttpErrorResponse) => {
        return ctx.dispatch(new ShowToast(MessageTypes.Error, err.error.errors[''][0]))
      })
    )
  }

  @Action(TimesheetDetails.GetDetailsByDate)
  GetDetailsByDate(
    ctx: StateContext<TimesheetsModel>,
    { orgId, startdate, jobId, isAgency }: TimesheetDetails.GetDetailsByDate,
  ): Observable<[void, void]> {
    return this.timesheetDetailsApiService.getDetailsByDate(orgId, startdate, jobId)
      .pipe(
        tap((res: TimesheetDetailsModel) => ctx.patchState({
            timesheetDetails: res,
          }),
        ),
        mergeMap((res) => forkJoin([
          ctx.dispatch(new TimesheetDetails.GetBillRates(res.jobId, orgId, isAgency)),
          ctx.dispatch(new TimesheetDetails.GetCostCenters(res.jobId, orgId, isAgency)),
        ])),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 400) {
            ctx.dispatch(new ShowToast(MessageTypes.Error, GetBydateErrMessage));

            ctx.patchState({
              timesheetDetails: {
                ...ctx.getState().timesheetDetails as TimesheetDetailsModel,
                status: 0,
                statusText: '',
                rejectionReason: undefined,
                noWorkPerformed: false,
                isNotExist: true,
                timesheetStatistic: {
                  cumulativeCharge: 0,
                  cumulativeHours: 0,
                  cumulativeMiles: 0,
                  weekCharge: 0,
                  weekHours: 0,
                  weekMiles: 0,
                  timesheetStatisticDetails: [],
                }
              },
              timeSheetRecords: {
                timesheets: {
                  editMode: [],
                  viewMode: [],
                },
                miles: {
                  editMode: [],
                  viewMode: [],
                },
                expenses: {
                  editMode: [],
                  viewMode: [],
                },
              }
            })
          }
          return throwError(() => err);
        })
      );
  }
}
