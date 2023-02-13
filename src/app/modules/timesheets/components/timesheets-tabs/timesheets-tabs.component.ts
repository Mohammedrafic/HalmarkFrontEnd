import {
  ChangeDetectionStrategy, Component, EventEmitter,
  Input, NgZone, OnChanges, Output, SimpleChanges, ViewChild,
} from '@angular/core';

import { SelectingEventArgs, TabComponent } from '@syncfusion/ej2-angular-navigations';
import { TabsListConfig } from '@shared/components/tabs-list/tabs-list-config.model';
import { Destroyable } from '@core/helpers';
import { OutsideZone } from '@core/decorators';
import { TabConfig } from '../../interface';
import { AlertIdEnum } from '@admin/alerts/alerts.enum';

@Component({
  selector: 'app-timesheets-tabs',
  templateUrl: './timesheets-tabs.component.html',
  styleUrls: ['./timesheets-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimesheetsTabsComponent extends Destroyable implements OnChanges {
  @ViewChild(TabComponent)
  public tabComponent: TabComponent;

  @Input()
  public tabConfig: TabConfig[];

  @Input()
  public isDisabled: boolean = false;

  @Output()
  public readonly changeTab: EventEmitter<number> = new EventEmitter<number>();
  public alertTitle: string;

  constructor(
    private readonly ngZone: NgZone,
  ) {
    super();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.tabConfig) {
      this.asyncRefresh();
    }
    this.alertTitle = JSON.parse(localStorage.getItem('alertTitle') || '""') as string;
    //Pending Approval Tab navigation
    if (AlertIdEnum[AlertIdEnum['Time Sheet: Org. pending approval']].toLowerCase() == this.alertTitle.toLowerCase()) {
      setTimeout(() => {
        this.tabComponent.selectedItem = 1;
        this.changeTab.emit(1);
      }, 5000);
      window.localStorage.setItem("alertTitle", JSON.stringify(""));
    }
    //Rejected Tab navigation.
    if (AlertIdEnum[AlertIdEnum['Time Sheet: Rejected']].toLowerCase() == this.alertTitle.toLowerCase()) {
      setTimeout(() => {
        this.tabComponent.selectedItem = 3;
        this.changeTab.emit(3);
      }, 5000);
      window.localStorage.setItem("alertTitle", JSON.stringify(""));
    }
  }

  public trackBy(_: number, item: TabsListConfig): string {
    return item.title;
  }

  public programSelection(idx = 0): void {
    this.tabComponent.select(idx);
  }

  public onSelect(selectEvent: SelectingEventArgs): void {
    this.changeTab.emit(selectEvent.selectingIndex);
  }

  @OutsideZone
  private asyncRefresh(): void {
    setTimeout(() => {
      this.tabComponent.refreshActiveTabBorder();
    });
  }
}
