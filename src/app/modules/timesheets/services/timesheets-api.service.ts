import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { catchError, map, Observable, of } from 'rxjs';

import { BillRate } from '@shared/models/bill-rate.model';
import { DataSourceItem, DropdownOption } from '@core/interface';

import {
  TimesheetsFilterState, TimesheetRecordsDto, CostCentersDto,
  AddRecordDto, PutRecordDto, TimesheetsFilteringOptions, TabCountConfig, RawTimsheetRecordsDto
} from '../interface';
import { CostCenterAdapter } from '../helpers';
import { RecordsAdapter } from '../helpers';
import { TimeSheetsPage } from '../store/model/timesheets.model';

@Injectable()
export class TimesheetsApiService {

  constructor(
    private http: HttpClient,
  ) {}

  public getTimesheets(filters: TimesheetsFilterState): Observable<TimeSheetsPage> {
    return this.http.post<TimeSheetsPage>('/api/Timesheets', {
      ...filters,
    });
  }

  public getTabsCounts(filters: TimesheetsFilterState): Observable<TabCountConfig> {
    return this.http.post<TabCountConfig>('/api/Timesheets/tabcounters', {
      ...filters,
    });
  }

  public getTimesheetRecords(
    id: number,
    orgId: number,
    isAgency: boolean,
    ): Observable<TimesheetRecordsDto> {
    const endpoint = !isAgency
    ? `/api/Timesheets/${id}/records` : `/api/Timesheets/${id}/records/organization/${orgId}`;
    return this.http.get<RawTimsheetRecordsDto>(endpoint)
    .pipe(
      map((data) => RecordsAdapter.adaptRecordsDto(data)),
      catchError(() => of({
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
      }))
    );
  }

  public postBulkApprove(timesheetIds: number[]): Observable<void> {
    return this.http.post<void>('/api/TimesheetState/bulkapprove', { timesheetIds });
  }

  public addTimesheetRecord(body: AddRecordDto): Observable<void> {
    return this.http.post<void>(`/api/Timesheets/${body.timesheetId}/records`, body);
  }

  public putTimesheetRecords(
    dto: PutRecordDto,
  ): Observable<void> {
    return this.http.put<void>(`/api/Timesheets/${dto.timesheetId}/records`, dto);
  }

  public deleteProfileTimesheets(profileId: number, profileTimesheetId: number): Observable<null> {
    return of(null);
  }

  public getFiltersDataSource(
    organizationId: number | null = null
  ): Observable<TimesheetsFilteringOptions> {
    return this.http.get<TimesheetsFilteringOptions>(
      `/api/Timesheets/filteringOptions${organizationId ? `/${organizationId}` : ''}`);
  }

  public getCandidateCostCenters(jobId: number, orgId: number, isAgency: boolean): Observable<DropdownOption[]>{
    const endpoint = isAgency ?
    `/api/Jobs/${jobId}/costcenters/${orgId}` : `/api/Jobs/${jobId}/costcenters`;

    return this.http.get<CostCentersDto>(endpoint)
    .pipe(
      map((res) => CostCenterAdapter(res)),
    );
  }

  public getOrganizations(): Observable<DataSourceItem[]> {
    return this.http.get<DataSourceItem[]>(`/api/Agency/partneredorganizations`);
  }

  public getCandidateBillRates(
    jobId: number,
    orgId: number,
    isAgency: boolean,
    ): Observable<DropdownOption[]> {
    const endpoint = isAgency ?
    `/api/Jobs/${jobId}/billrates/${orgId}` : `/api/Jobs/${jobId}/billrates`;
    return this.http.get<BillRate[]>(endpoint)
    .pipe(
      map((res) => res.map((item) => {
        return {
          text: item.billRateConfig.title,
          value: item.billRateConfig.id,
        }
      })),
    );
  }

  public uploadMilesAttachments(
    timesheetRecordId: number | null,
    formData: FormData,
    organizationId: number | null = null,
  ): Observable<void> {
    if(organizationId) {
      return this.http.post<void>(`/api/TimesheetRecords/${timesheetRecordId}/organizations/${organizationId}/files`, formData);
    }
    return this.http.post<void>(`/api/TimesheetRecords/${timesheetRecordId}/files`, formData);
  }

  public deleteMilesAttachment(
    timesheetRecordId: number | null,
    fileId: number,
    organizationId: number | null = null,
  ): Observable<void> {
    if(organizationId) {
      return this.http.delete<void>(`/api/TimesheetRecords/${timesheetRecordId}/organizations/${organizationId}/files/${fileId}`);
    }
    return this.http.delete<void>(`/api/TimesheetRecords/${timesheetRecordId}/files/${fileId}`);
  }
}
