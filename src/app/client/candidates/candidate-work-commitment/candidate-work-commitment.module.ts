import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { FeatherModule } from 'angular-feather';
import { ButtonModule, SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { DateTimePickerModule } from '@syncfusion/ej2-angular-calendars';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { DialogModule } from '@syncfusion/ej2-angular-popups';

import { GridModule } from '@shared/components/grid/grid.module';
import { SharedModule } from '@shared/shared.module';
import { InputModule } from '@shared/components/form-controls/input/input.module';
import { DatepickerModule } from '@shared/components/form-controls/datepicker/datepicker.module';
import { DropdownModule } from '@shared/components/form-controls/dropdown/dropdown.module';
import { MultiselectDropdownModule } from
  '@shared/components/form-controls/multiselect-dropdown/multiselect-dropdown.module';
import { TextareaModule } from '@shared/components/form-controls/textarea/textarea.module';
import { NumericTextboxModule } from '@shared/components/form-controls/numeric-textbox/numeric-textbox.module';
import { CandidateWorkCommitmentComponent } from './candidate-work-commitment.component';
import { CandidateWorkCommitmentGridComponent } from
  './components/candidate-work-commitment-grid/candidate-work-commitment-grid.component';
import { CandidateCommitmentGridActionRendererComponent } from
  './components/candidate-work-commitment-grid/grid-action-renderer/grid-action-renderer.component';
import { CandidateWorkCommitmentDialogComponent } from
  './components/candidate-work-commitment-dialog/candidate-work-commitment-dialog.component';
import { CandidateWorkCommitmentService } from './services/candidate-work-commitment.service';
import { AvailabilityRestrictionComponent } from './components/availability-restriction/availability-restriction.component';
import { AvailabilityRestrictionDialogComponent } from
  './components/availability-restriction-dialog/availability-restriction-dialog.component';
import { AvailabilityApiService } from './services/availability-api.service';
import { AvailabilityHelperService } from './services/availability-helper.service';

@NgModule({
  declarations: [
    CandidateWorkCommitmentComponent,
    CandidateWorkCommitmentGridComponent,
    CandidateCommitmentGridActionRendererComponent,
    CandidateWorkCommitmentDialogComponent,
    AvailabilityRestrictionComponent,
    AvailabilityRestrictionDialogComponent,
  ],
  exports: [],
  imports: [
    CommonModule,
    InputModule,
    DatepickerModule,
    DateTimePickerModule,
    DropdownModule,
    MultiselectDropdownModule,
    SwitchModule,
    TextareaModule,
    NumericTextboxModule,
    GridModule,
    FeatherModule,
    ButtonModule,
    SharedModule,
    DropDownListModule,
    DialogModule,
    ReactiveFormsModule,
  ],
  providers: [
    CandidateWorkCommitmentService,
    AvailabilityApiService,
    AvailabilityHelperService,
  ],
})
export class CandidateWorkCommitmentModule { }
