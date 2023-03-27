import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TrackByFunction,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { Select, Store } from '@ngxs/store';
import { AutoCompleteComponent } from '@syncfusion/ej2-angular-dropdowns/src/auto-complete/autocomplete.component';
import { ItemModel } from '@syncfusion/ej2-splitbuttons/src/common/common-model';
import { FieldSettingsModel } from '@syncfusion/ej2-dropdowns/src/drop-down-base/drop-down-base-model';
import { FilteringEventArgs } from '@syncfusion/ej2-angular-dropdowns';
import { debounceTime, fromEvent, Observable, switchMap, take, takeUntil, tap } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DatesRangeType } from '@shared/enums';
import { DateTimeHelper, Destroyable } from '@core/helpers';
import { DateWeekService } from '@core/services';
import { GetOrganizationById } from '@organization-management/store/organization-management.actions';
import { OrganizationManagementState } from '@organization-management/store/organization-management.state';
import { ScheduleApiService } from '../../services';
import { UserState } from '../../../../store/user.state';
import { ScheduleGridAdapter } from '../../adapters';
import { DatesPeriods, MonthPeriod } from '../../constants';
import * as ScheduleInt from '../../interface';
import { CardClickEvent, CellClickEvent, ScheduleCandidatesPage, ScheduleDateItem } from '../../interface';
import { GetMonthRange } from '../../helpers';

@Component({
  selector: 'app-schedule-grid',
  templateUrl: './schedule-grid.component.html',
  styleUrls: ['./schedule-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleGridComponent extends Destroyable implements OnInit, OnChanges {
  @Select(UserState.lastSelectedOrganizationId)
  private organizationId$: Observable<number>;

  @ViewChild('scrollArea', { static: true }) scrollArea: ElementRef;
  @ViewChild('autoCompleteSearch') autoCompleteSearch: AutoCompleteComponent;

  @Input() scheduleData: ScheduleInt.ScheduleModelPage | null;
  @Input() selectedFilters: ScheduleInt.ScheduleFilters;
  @Input() hasViewPermission = false;

  @Output() changeFilter: EventEmitter<ScheduleInt.ScheduleFilters> = new EventEmitter<ScheduleInt.ScheduleFilters>();
  @Output() loadMoreData: EventEmitter<number> = new EventEmitter<number>();
  @Output() selectedCells: EventEmitter<ScheduleInt.ScheduleSelectedSlots>
    = new EventEmitter<ScheduleInt.ScheduleSelectedSlots>();
  @Output() scheduleCell: EventEmitter<ScheduleInt.ScheduleSelectedSlots>
    = new EventEmitter<ScheduleInt.ScheduleSelectedSlots>();
  @Output() selectCandidate: EventEmitter<ScheduleInt.ScheduleCandidate | null>
    = new EventEmitter<ScheduleInt.ScheduleCandidate | null>();
  @Output() editCell: EventEmitter<ScheduleInt.ScheduledItem> = new EventEmitter<ScheduleInt.ScheduledItem>();

  datesPeriods: ItemModel[] = DatesPeriods;

  activePeriod = DatesRangeType.TwoWeeks;

  monthPeriod = DatesRangeType.Month;

  weekPeriod: [Date, Date] = [DateTimeHelper.getCurrentDateWithoutOffset(), DateTimeHelper.getCurrentDateWithoutOffset()];

  datesRanges: string[] = DateTimeHelper.getDatesBetween();

  monthRangeDays: string[] = [];

  selectedCandidatesSlot: Map<number, ScheduleInt.ScheduleDateSlot>
  = new Map<number, ScheduleInt.ScheduleDateSlot>();

  orgFirstDayOfWeek: number;

  searchControl = new FormControl();

  candidatesSuggestions: ScheduleInt.ScheduleCandidate[] = [];

  candidateNameFields: FieldSettingsModel = { text: 'fullName' };

  isEmployee = false;

  private itemsPerPage = 30;

  private filteredByEmployee = false;

  constructor(
    private store: Store,
    private weekService: DateWeekService,
    private scheduleApiService: ScheduleApiService,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  trackByPeriods: TrackByFunction<ItemModel> = (_: number, period: ItemModel) => period.text;

  trackByDatesRange: TrackByFunction<string> = (_: number, date: string) => date;

  trackByScheduleData: TrackByFunction<ScheduleInt.ScheduleModel> = (_: number,
    scheduleData: ScheduleInt.ScheduleModel) => scheduleData.id;

  ngOnInit(): void {
    this.startOrgIdWatching();
    this.watchForScroll();
    this.watchForCandidateSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.selectedCandidatesSlot.clear();
    if (changes['selectedFilters'] && !this.filteredByEmployee) {
      this.filterByEmployee();
    }
  }

  changeActiveDatePeriod(selectedPeriod: string | undefined): void {
    if (this.hasViewPermission) {
      this.activePeriod = selectedPeriod as DatesRangeType;
      this.cdr.detectChanges();
    }
  }

  handleCellSingleClick(date: string, candidate: ScheduleInt.ScheduleCandidate, cellDate?: ScheduleDateItem): void {
    if(!cellDate?.isDisabled) {
      this.selectDateSlot(date, candidate);
      this.selectedCells.emit(ScheduleGridAdapter.prepareSelectedCells(this.selectedCandidatesSlot, cellDate));
    }
  }

  handleCellDblClick(date: string, candidate: ScheduleInt.ScheduleCandidate): void {
    if(this.getSelectionAvailable()) {
      this.selectedCandidatesSlot.clear();
      this.selectDateSlot(date, candidate);
      this.scheduleCell.emit(ScheduleGridAdapter.prepareSelectedCells(this.selectedCandidatesSlot));
      this.cdr.detectChanges();
    }
  }

  handleScheduleCardDblClick(
    schedule: ScheduleInt.ScheduleDateItem,
    candidate: ScheduleInt.ScheduleCandidate,
    cellDate?: ScheduleDateItem
  ): void {
    if(!cellDate?.isDisabled) {
      const dateStringLength = 10;
      const formattedDateSting = schedule.date.substring(0, dateStringLength);

      this.selectedCandidatesSlot.clear();
      this.selectDateSlot(formattedDateSting, candidate);
      this.editCell.emit({ candidate, schedule });
    }
  }

  selectDateSlot(date: string, candidate: ScheduleInt.ScheduleCandidate): void {
    const candidateSelectedSlot = this.selectedCandidatesSlot.get(candidate.id);

    if (candidateSelectedSlot) {
      if (candidateSelectedSlot.dates.has(date)) {
        candidateSelectedSlot.dates.delete(date);

        if (!candidateSelectedSlot.dates.size) {
          this.selectedCandidatesSlot.delete(candidate.id);
        }
      } else {
        candidateSelectedSlot.dates.add(date);
      }
    } else {
      this.selectedCandidatesSlot.set(candidate.id, { candidate, dates: new Set<string>().add(date) });
    }
  }

  filteringCandidates(eventArgs: FilteringEventArgs): void {
    this.searchControl.setValue(eventArgs);
  }

  autoSelectCandidate(candidate: ScheduleInt.ScheduleCandidate | null): void {
    this.emitSelectedCandidate(candidate);
  }

  emitSelectedCandidate(candidate: ScheduleInt.ScheduleCandidate | null): void {
    this.datesPeriods = candidate ? [...DatesPeriods, ...MonthPeriod] : DatesPeriods;
    this.activePeriod = this.datesPeriods.includes(MonthPeriod[0]) ? DatesRangeType.Month : DatesRangeType.TwoWeeks;
    this.selectCandidate.emit(candidate);
    this.cdr.markForCheck();
  }

  singleMonthClick({date, candidate, cellDate }: CardClickEvent): void {
    this.handleCellSingleClick(date, candidate, cellDate);
  }

  doubleMonthCardClick({ schedule, candidate, cellDate }: CellClickEvent): void {
    this.handleScheduleCardDblClick(schedule,candidate, cellDate);
  }

  doubleMonthCellClick({date, candidate}: CardClickEvent): void {
    this.handleCellDblClick(date, candidate);
  }

  private startOrgIdWatching(): void {
    this.organizationId$.pipe(
      filter(Boolean),
      tap(() => {
        if (!this.isEmployee) {
          this.autoCompleteSearch?.clear();
        }
      }),
      switchMap((businessUnitId: number) => {
        return this.store.dispatch(new GetOrganizationById(businessUnitId));
      }),
      switchMap(() => {
        this.checkOrgPreferences();
        return this.watchForRangeChange();
      }),
      takeUntil(this.componentDestroy()),
    ).subscribe();
  }

  private checkOrgPreferences(): void {
    const preferences = this.store.selectSnapshot(OrganizationManagementState.organization)?.preferences;
    this.orgFirstDayOfWeek = preferences?.weekStartsOn as number;
    this.monthRangeDays = GetMonthRange(this.orgFirstDayOfWeek ?? 0);

    this.cdr.markForCheck();
  }

  private watchForRangeChange(): Observable<[string, string]> {
    return this.weekService.getRangeStream().pipe(
      debounceTime(200),
      filter(([startDate, endDate]: [string, string]) => !!startDate && !!endDate),
      tap(([startDate, endDate]: [string, string]) => {
        this.datesRanges = DateTimeHelper.getDatesBetween(startDate, endDate);
        this.changeFilter.emit({ startDate, endDate });
        this.scrollArea.nativeElement.scrollTo(0, 0);

        this.cdr.detectChanges();
      }),
    );
  }

  private watchForScroll(): void {
    fromEvent(this.scrollArea.nativeElement, 'scroll')
      .pipe(
        debounceTime(500),
        filter(() => {
          const { scrollTop, scrollHeight, offsetHeight } = this.scrollArea.nativeElement;

          return scrollTop + offsetHeight >= scrollHeight;
        }),
        takeUntil(this.componentDestroy()),
      )
      .subscribe(() => {
        const { items, totalCount } = this.scheduleData || {};

        if ((items?.length || 0) < (totalCount || 0)) {
          this.loadMoreData.emit(Math.ceil((items?.length || 1) / this.itemsPerPage));
        }
      });
  }

  private watchForCandidateSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(1000),
      tap((filteringEventArgs: FilteringEventArgs) => {
        if (!filteringEventArgs?.text || !filteringEventArgs?.text.length) {
          this.candidatesSuggestions = [];
          filteringEventArgs.updateData([]);
        }
      }),
      switchMap((filteringEventArgs: FilteringEventArgs) => this.scheduleApiService.getScheduleEmployees({
        firstLastNameOrId: filteringEventArgs.text,
        startDate: this.selectedFilters.startDate,
        endDate: this.selectedFilters.endDate,
      }).pipe(
        tap((employeeDto) => {
          this.candidatesSuggestions = ScheduleGridAdapter.prepareCandidateFullName(employeeDto.items);
          filteringEventArgs.updateData(
            this.candidatesSuggestions as unknown as { [key: string]: ScheduleInt.ScheduleCandidate }[]
          );
        }),
      )),
      takeUntil(this.componentDestroy()),
    ).subscribe();
  }

  private getSelectionAvailable(): boolean {
    if(this.scheduleData &&
      this.scheduleData?.items.length === 1) {
      return true;
    } else {
      return !!(this.scheduleData &&
        this.scheduleData?.items.length > 1 &&
        this.selectedFilters.departmentsIds?.length === 1);
    }
  }

  private filterByEmployee(): void {
    const user = this.store.selectSnapshot(UserState.user);
    this.isEmployee = user?.isEmployee || false;

    if (user?.isEmployee && this.selectedFilters.startDate && this.selectedFilters.endDate) {
      this.filteredByEmployee = true;
      this.autoCompleteSearch?.writeValue(user.fullName);
      this.scheduleApiService.getScheduleEmployees({
        firstLastNameOrId: user.fullName,
        startDate: this.selectedFilters.startDate,
        endDate: this.selectedFilters.endDate,
      })
        .pipe(take(1))
        .subscribe((page: ScheduleCandidatesPage) => {
          this.autoSelectCandidate(page.items[0]);
        });
    }
  }
}
