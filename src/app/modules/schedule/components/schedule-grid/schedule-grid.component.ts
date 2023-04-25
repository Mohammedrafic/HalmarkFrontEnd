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

import { DatesRangeType, WeekDays } from '@shared/enums';
import { DateTimeHelper, Destroyable } from '@core/helpers';
import { DateWeekService } from '@core/services';
import { PreservedFiltersByPage } from '@core/interface';
import { FilterPageName } from '@core/enums';
import { GetOrganizationById } from '@organization-management/store/organization-management.actions';
import { OrganizationManagementState } from '@organization-management/store/organization-management.state';
import { CreateScheduleService, ScheduleApiService, ScheduleFiltersService } from '../../services';
import { UserState } from '../../../../store/user.state';
import { ScheduleGridAdapter } from '../../adapters';
import { DatesPeriods, MonthPeriod, PermissionRequired } from '../../constants';
import * as ScheduleInt from '../../interface';
import {
  CardClickEvent,
  RemovedSlot,
  ScheduleCandidatesPage,
  ScheduleModel,
  SelectedCells,
} from '../../interface';
import { GetMonthRange, GetScheduledShift } from '../../helpers';
import { ScheduleGridService } from './schedule-grid.service';
import { ShowToast } from '../../../../store/app.actions';
import { MessageTypes } from '@shared/enums/message-types';
import { ScheduleItemsService } from '../../services/schedule-items.service';
import { GetPreservedFiltersByPage, ResetPageFilters } from 'src/app/store/preserved-filters.actions';
import { PreservedFiltersState } from 'src/app/store/preserved-filters.state';
import { ClearOrganizationStructure } from 'src/app/store/user.actions';

@Component({
  selector: 'app-schedule-grid',
  templateUrl: './schedule-grid.component.html',
  styleUrls: ['./schedule-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleGridComponent extends Destroyable implements OnInit, OnChanges {
  @Select(UserState.lastSelectedOrganizationId)
  private organizationId$: Observable<number>;

  @Select(PreservedFiltersState.preservedFiltersByPageName)
  private readonly preservedFiltersByPageName$: Observable<PreservedFiltersByPage<ScheduleInt.ScheduleFilters>>;

  @ViewChild('scrollArea', { static: true }) scrollArea: ElementRef;
  @ViewChild('autoCompleteSearch') autoCompleteSearch: AutoCompleteComponent;

  @Input() set initScheduleDate(scheduleData: ScheduleInt.ScheduleModelPage | null) {
    this.scheduleData = scheduleData;
    if(scheduleData) {
      this.scheduleSlotsWithDate = this.scheduleGridService.getSlotsWithDate(scheduleData);
    }

    this.cdr.markForCheck();
  }

  @Input() selectedFilters: ScheduleInt.ScheduleFilters;
  @Input() hasViewPermission = false;
  @Input() hasSchedulePermission = false;

  @Output() changeFilter: EventEmitter<ScheduleInt.ScheduleFilters> = new EventEmitter<ScheduleInt.ScheduleFilters>();
  @Output() loadMoreData: EventEmitter<number> = new EventEmitter<number>();
  @Output() selectedCells: EventEmitter<SelectedCells> = new EventEmitter<SelectedCells>();
  @Output() selectCandidate: EventEmitter<ScheduleInt.ScheduleCandidate | null>
    = new EventEmitter<ScheduleInt.ScheduleCandidate | null>();
  @Output() editCell: EventEmitter<ScheduleInt.ScheduledItem> = new EventEmitter<ScheduleInt.ScheduledItem>();

  datesPeriods: ItemModel[] = DatesPeriods;

  scheduleData: ScheduleInt.ScheduleModelPage | null;

  scheduleSlotsWithDate: string[];

  activePeriod = DatesRangeType.TwoWeeks;

  monthPeriod = DatesRangeType.Month;

  weekPeriod: [Date, Date] = [DateTimeHelper.getCurrentDateWithoutOffset(), DateTimeHelper.getCurrentDateWithoutOffset()];

  datesRanges: ScheduleInt.DateRangeOption[] = this.scheduleItemsService
  .createRangeOptions(DateTimeHelper.getDatesBetween());

  monthRangeDays: WeekDays[] = [];

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
    private createScheduleService: CreateScheduleService,
    private scheduleGridService: ScheduleGridService,
    private scheduleItemsService: ScheduleItemsService,
    private scheduleFiltersService: ScheduleFiltersService,
  ) {
    super();
  }

  trackByPeriods: TrackByFunction<ItemModel> = (_: number, period: ItemModel) => period.text;

  trackByDatesRange: TrackByFunction<ScheduleInt.DateRangeOption> =
   (_: number, date: ScheduleInt.DateRangeOption) => date.dateText;

  trackByweekDays: TrackByFunction<WeekDays> = (_: number, date: WeekDays) => date;

  trackByScheduleData: TrackByFunction<ScheduleInt.ScheduleModel> = (_: number,
    scheduleData: ScheduleInt.ScheduleModel) => scheduleData.id;

  ngOnInit(): void {
    this.startOrgIdWatching();
    this.watchForScroll();
    this.watchForCandidateSearch();
    this.watchForSideBarAction();
    this.watchForPreservedFilters();
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

  selectCellSlots(
    date: string,
    candidate: ScheduleInt.ScheduleCandidate,
    schedule?: ScheduleInt.ScheduleDateItem): void {
    if(!this.hasSchedulePermission) {
      this.store.dispatch(new ShowToast(MessageTypes.Error, PermissionRequired));
      return;
    }

    if(!schedule?.isDisabled) {
      this.selectDateSlot(date, candidate, schedule);
      this.processCellSelection(candidate, schedule);
    }
  }

  selectDateSlot(date: string, candidate: ScheduleInt.ScheduleCandidate, schedule?: ScheduleInt.ScheduleDateItem): void {
    const candidateSelectedSlot = this.selectedCandidatesSlot.get(candidate.id);

    if(schedule) {
      candidate.days = this.scheduleGridService.createDaysForSelectedSlots(candidate.days, schedule.daySchedules);
    }

    if (candidateSelectedSlot) {
      if (candidateSelectedSlot.dates.has(date)) {
        candidateSelectedSlot.dates.delete(date);
        candidateSelectedSlot.candidate.days = candidate.days;

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

  handleMonthClick({date, candidate, cellDate }: CardClickEvent): void {
    this.selectCellSlots(date, candidate, cellDate);
  }

  private processCellSelection(candidate: ScheduleInt.ScheduleCandidate, schedule?: ScheduleInt.ScheduleDateItem): void {
    const candidateId = this.selectedCandidatesSlot.size === 1
      ? Array.from(this.selectedCandidatesSlot.keys())[0]
      : candidate.id;
    const isEditSideBar = this.scheduleGridService.shouldShowEditSideBar(
      this.selectedCandidatesSlot,
      this.scheduleData?.items as ScheduleModel[],
      candidateId
    );

    if(isEditSideBar) {
      this.editCell.emit(GetScheduledShift(
        this.scheduleData as ScheduleInt.ScheduleModelPage,
        candidateId,
        this.scheduleGridService.getFirstSelectedDate(this.selectedCandidatesSlot),
      ));
    } else {
      this.selectedCells.emit({
        cells: ScheduleGridAdapter.prepareSelectedCells(this.selectedCandidatesSlot, schedule),
      });
    }
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

  private watchForSideBarAction(): void {
    this.createScheduleService.closeSideBarEvent.pipe(
      takeUntil(this.componentDestroy()),
    ).subscribe(() => {
      this.selectedCandidatesSlot = new Map<number, ScheduleInt.ScheduleDateSlot>();
      this.cdr.markForCheck();
    });

    this.scheduleItemsService.removeCandidateItem.pipe(
      takeUntil(this.componentDestroy()),
    ).subscribe((slot: RemovedSlot) => {
      const {date, candidate} = slot;

      if(slot.date) {
        this.selectCellSlots(date as string,candidate);
        this.selectedCells.emit({cells: ScheduleGridAdapter.prepareSelectedCells(this.selectedCandidatesSlot)});
      } else {
        this.selectedCandidatesSlot.delete(candidate.id);
        this.selectedCells.emit({
          cells: ScheduleGridAdapter.prepareSelectedCells(this.selectedCandidatesSlot),
          sideBarState: !!this.selectedCandidatesSlot.size,
        });
      }

      this.selectedCandidatesSlot = new Map(this.selectedCandidatesSlot);
    });
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
        this.datesRanges = this.scheduleItemsService.createRangeOptions(DateTimeHelper.getDatesBetween(startDate, endDate));
        this.changeFilter.emit({ startDate, endDate });
        this.scrollArea.nativeElement.scrollTo(0, 0);

        this.cdr.markForCheck();
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

  private watchForPreservedFilters(): void {
    let clearStructure = false;
    this.organizationId$.pipe(
      filter((id) => !!id),
      tap(() => {
        if (clearStructure) {
          this.store.dispatch(new ClearOrganizationStructure());
        } else {
          clearStructure = true;
        }

        this.store.dispatch([
          new ResetPageFilters(),
          new GetPreservedFiltersByPage(FilterPageName.SchedullerOrganization),
        ]);
      }),
      switchMap(() => this.preservedFiltersByPageName$),
      filter(({ dispatch }) => dispatch),
      takeUntil(this.componentDestroy()),
    ).subscribe((filters) => {
      this.setPreservedFiltersDataSource(filters.state || {});
    });
  }

  private setPreservedFiltersDataSource(filters: ScheduleInt.ScheduleFilters): void {
    this.scheduleFiltersService.setPreservedFiltersDataStream({ ...filters });
  }
}
