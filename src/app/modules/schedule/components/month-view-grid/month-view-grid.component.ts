import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  TrackByFunction,
} from '@angular/core';

import * as ScheduleInt from '../../interface';
import { CardClickEvent, CellClickEvent, DatesByWeekday, ScheduleDateItem } from '../../interface';
import { GetGroupedDatesByWeekday } from './month-view.helper';
import { MonthPickerService } from '@shared/components/month-date-picker';

@Component({
  selector: 'app-month-view-grid',
  templateUrl: './month-view-grid.component.html',
  styleUrls: ['./month-view-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthViewGridComponent {
  @Input() scheduleData: ScheduleInt.ScheduleModelPage | null;
  @Input() selectedFilters: ScheduleInt.ScheduleFilters;
  @Input()  selectedCandidatesSlot: Map<number, ScheduleInt.ScheduleDateSlot>;

  @Input() set datesRange(range: string[]) {
    const selectedMonth = this.monthPickerService.getSelectedMonth();
    this.dateList = GetGroupedDatesByWeekday(range, selectedMonth);
    this.cdr.markForCheck();
  }

  @Output() handleSelectCandidate: EventEmitter<ScheduleInt.ScheduleCandidate | null>
    = new EventEmitter<ScheduleInt.ScheduleCandidate | null>();
  @Output() handleMonthSingleClick: EventEmitter<CardClickEvent> = new EventEmitter<CardClickEvent>();
  @Output() handleMonthDoubleCardClick: EventEmitter<CellClickEvent> = new EventEmitter<CellClickEvent>();
  @Output() handleMonthDoubleCellClick: EventEmitter<CardClickEvent> = new EventEmitter<CardClickEvent>();

  public dateList: DatesByWeekday[][];

  trackByScheduleData: TrackByFunction<ScheduleInt.ScheduleModel> =
    (_: number, scheduleData: ScheduleInt.ScheduleModel) => scheduleData.id;
  trackByDateList: TrackByFunction<DatesByWeekday[]> =
    (_: number, date: DatesByWeekday[]) => date[0].dateSlot;
  trackByDateItem: TrackByFunction<DatesByWeekday> =
    (_: number, date: DatesByWeekday) => date.dateSlot;

  constructor(
    private cdr: ChangeDetectorRef,
    private monthPickerService: MonthPickerService
  ) {}

  public singleClick(
    date: string,
    candidate: ScheduleInt.ScheduleCandidate,
    isActive: boolean,
    cellDate?: ScheduleDateItem
  ): void {
    if(isActive) {
      this.handleMonthSingleClick.emit({ date, candidate, cellDate });
    }
  }

  public doubleCardClick(
    schedule: ScheduleInt.ScheduleDateItem,
    candidate: ScheduleInt.ScheduleCandidate,
    isActive: boolean,
    cellDate?: ScheduleDateItem): void {
    if(isActive) {
      this.handleMonthDoubleCardClick.emit({ schedule, candidate, cellDate });
    }
  }

  public doubleCellClick(date: string, candidate: ScheduleInt.ScheduleCandidate, isActive: boolean,): void {
    if(isActive) {
      this.handleMonthDoubleCellClick.emit({date, candidate});
    }
  }
}
