import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sliders } from 'angular-feather/icons';
import { DashboardControlComponent } from './dashboard-control.component';
import { FeatherModule } from 'angular-feather';
import { ButtonModule, ChipListAllModule } from '@syncfusion/ej2-angular-buttons';
import { GridModule } from '@syncfusion/ej2-angular-grids';
import { WidgetListComponent } from './components/widget-list/widget-list.component';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { SharedModule } from '@shared/shared.module';
import { InlineLoaderModule } from '@shared/components/inline-loader/inline-loader.module';
import { WidgetFilterComponent } from './components/widget-filter/widget-filter.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MultiSelectAllModule } from '@syncfusion/ej2-angular-dropdowns';


@NgModule({
  declarations: [DashboardControlComponent, WidgetListComponent, WidgetFilterComponent],
  imports: [
    CommonModule,
    ButtonModule,
    GridModule,
    DialogModule,
    SharedModule,
    FeatherModule.pick({ Sliders }),
    InlineLoaderModule,
    ReactiveFormsModule,
    MultiSelectAllModule,
    ChipListAllModule
  ],
  exports: [DashboardControlComponent],
})
export class DashboardControlModule {}
