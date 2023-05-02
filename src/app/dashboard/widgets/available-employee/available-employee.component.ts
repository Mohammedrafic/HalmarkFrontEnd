import { Component, OnInit, ChangeDetectionStrategy,Input, ChangeDetectorRef, Inject, ViewChild, ViewChildren, OnDestroy } from '@angular/core';
import { AvailableEmployeeModel } from '../../models/available-employee.model';
import { ColDef, GridOptions } from '@ag-grid-community/core';
import { AgGridAngular } from '@ag-grid-community/angular';

@Component({
  selector: 'app-available-employee',
  templateUrl: './available-employee.component.html',
  styleUrls: ['./available-employee.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvailableEmployeeComponent  implements OnInit {
  @Input() public chartData:AvailableEmployeeModel[] | undefined ;
  @Input() isDarkTheme: boolean | false;
  @Input() description: string;
  @Input() public isLoading: boolean;
  @ViewChild('availableEmployees') availableEmployees:AgGridAngular

  ngOnInit(): void {
  }
  public rowData: AvailableEmployeeModel[] ;
  public columnDefs:ColDef[] = [
    { field: 'fullName', headerName:"Name",width:150},
    { field: 'startDateTime', headerName:"Start Date Time",width:180},
    { field: 'endDateTime', headerName:"End Date Time",width:180},
  ];
 
}