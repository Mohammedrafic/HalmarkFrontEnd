import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsRoutingModule } from './alerts-routing.module';
import { UserSubscriptionComponent } from './user-subscription/user-subscription.component';
import { AlertsComponent } from './alerts.component';
import { PageToolbarModule } from '@shared/components/page-toolbar/page-toolbar.module';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import {SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { AgGridModule } from '@ag-grid-community/angular';
import { MultiselectDropdownModule } from '@shared/components/form-controls/multiselect-dropdown/multiselect-dropdown.module';
import {FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxsModule } from '@ngxs/store';
import { AlertsState } from '@admin/store/alerts.state';
import { AlertsTemplateComponent } from './alerts-template/alerts-template.component';
import { SharedModule } from '../../shared/shared.module';
import { AlertsEmailTemplateFormComponent } from './alerts-template/alerts-email-template-form/alerts-email-template-form.component';
import { ListBoxAllModule } from '@syncfusion/ej2-angular-dropdowns';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import{ListViewAllModule} from '@syncfusion/ej2-angular-lists';
import { DialogModule } from '@syncfusion/ej2-angular-popups';
import { AlertsSmsTemplateFromComponent } from './alerts-template/alerts-sms-template-from/alerts-sms-template-from.component';
import { AlertsOnScreenTemplateFormComponent } from './alerts-template/alerts-on-screen-template-form/alerts-on-screen-template-form.component';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';


@NgModule({
  declarations: [
    AlertsComponent,
    UserSubscriptionComponent,
    AlertsTemplateComponent,
    AlertsEmailTemplateFormComponent,
    AlertsSmsTemplateFromComponent,
    AlertsOnScreenTemplateFormComponent, 
  ],
  imports: [
    CommonModule,
    AlertsRoutingModule,
    PageToolbarModule,
    DropDownListModule,
    AgGridModule,
    MultiselectDropdownModule,    
    ReactiveFormsModule,
    FormsModule,
    RichTextEditorAllModule,
    ListBoxAllModule,
    ListViewAllModule,
    SwitchModule,
    SharedModule,
    DialogModule,
    TextBoxModule,
    NgxsModule.forFeature([AlertsState]),
  ]
})
export class AlertsModule { }
