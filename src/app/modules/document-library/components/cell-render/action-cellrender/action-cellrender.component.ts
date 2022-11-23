import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Component, OnInit } from '@angular/core';
import { ItemModel } from '@syncfusion/ej2-angular-navigations';
import { MoreMenuType } from '../../../enums/documents.enum';

@Component({
  selector: 'app-action-cellrender',
  templateUrl: './action-cellrender.component.html',
  styleUrls: ['./action-cellrender.component.scss']
})
export class ActionCellrenderComponent implements ICellRendererAngularComp {

  public params: any;

  agInit(params: any): void {
    this.params = params;

  }

  documentDownload(event: MouseEvent) {
    event.stopImmediatePropagation();
    this.params.handleOnDownLoad(this.params.data);
  }

  menuOptionSelected(event:any) {
    this.params.select(event,this.params.data)
  }

  deleteDocument(event: any) {
    this.params.handleOnDownLoad(this.params.data);
  }

  refresh() {
    return true;
  }
}
