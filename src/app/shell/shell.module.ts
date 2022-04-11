import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SidebarModule } from '@syncfusion/ej2-angular-navigations';
import { SwitchModule } from '@syncfusion/ej2-angular-buttons';
import { FeatherModule } from 'angular-feather';
import {
  DollarSign,
  Clock,
  FileText,
  BookOpen,
  Home,
  Info,
  Sidebar,
  Users,
  Clipboard,
  LogIn
} from 'angular-feather/icons';

import { ShellRoutingModule } from './shell-routing.module';
import { ShellPageComponent } from './shell.component';

const sidebarIcons = {
  Sidebar,
  BookOpen,
  Info,
  Home,
  FileText,
  Clock,
  Users,
  DollarSign,
  Clipboard,
  LogIn
};

@NgModule({
  declarations: [ShellPageComponent],
  imports: [
    CommonModule,
    ShellRoutingModule,
    SidebarModule,
    SwitchModule,
    FeatherModule.pick(sidebarIcons),
  ],
  providers: [],
})
export class ShellModule {}
