import { DatePipe } from '@angular/common';
import { ExportedFileType } from '@shared/enums/exported-file-type';
import { SortingDirections } from '@shared/enums/sorting';
import { FilteredItem } from '@shared/models/filter.model';
import { GridComponent, PageEventArgs, SelectionSettingsModel } from '@syncfusion/ej2-angular-grids';
import { ResizeSettingsModel } from '@syncfusion/ej2-grids/src/grid/base/grid-model';

import { GRID_CONFIG } from '../../constants/grid-config';
import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { GridColumn } from '@shared/models/grid-column.model';

enum ExportType {
  'Excel File',
  'CSV File',
  'Custom',
}

export abstract class AbstractGridConfigurationComponent {
  gridWithChildRow: GridComponent;
  // grid
  gridDataSource: object[] = [];
  allowPaging = GRID_CONFIG.isPagingEnabled;
  pageSettings = GRID_CONFIG.gridPageSettings;
  gridHeight = GRID_CONFIG.gridHeight;
  fullScreenGridHeight = GRID_CONFIG.fullScreenGridHeight;
  rowHeight = GRID_CONFIG.initialRowHeight;
  resizeSettings: ResizeSettingsModel = GRID_CONFIG.resizeSettings;
  allowSorting = GRID_CONFIG.isSortingEnabled;
  allowResizing = GRID_CONFIG.isResizingEnabled;

  // rows per page
  rowsPerPageDropDown = GRID_CONFIG.rowsPerPageDropDown;
  activeRowsPerPageDropDown = GRID_CONFIG.rowsPerPageDropDown[0];

  // go to page
  lastAvailablePage = 0;
  validateDecimalOnType = true;
  decimals = 0;

  // pager
  totalDataRecords: number;
  pageSizePager = GRID_CONFIG.initialRowsPerPage;
  currentPagerPage: number = 1;

  pageSize = 30;
  currentPage = 1;
  orderBy = '';

  refreshing = false;

  clickedElement: any;

  // Subrow
  subrowsState = new Set<number>();

  exportOptions = [
    { text: ExportType[0], id: 0 },
    { text: ExportType[1], id: 1 },
    { text: ExportType[2], id: 2 },
  ];

  selectionSettings: SelectionSettingsModel = {
    persistSelection: true,
  };
  selectedItems: any[] = [];
  idFieldName = 'id'; // Override in child component in case different id property

  filteredItems: FilteredItem[] = [];
  filteredCount = 0;

  protected constructor() {}

  generateDateTime(datePipe: DatePipe): string {
    if (datePipe) {
      return datePipe.transform(Date.now(), 'MM/dd/yyyy hh:mm a') as string;
    }
    return '';
  }

  rowSelected(event: any, grid: any): void {
    if (!event.target) {
      return;
    }
    if (event.data?.length === 0) {
      this.selectedItems.push(...grid.dataSource);
    } else {
      this.selectedItems.push(event.data);
    }
  }

  rowDeselected(event: any, grid: any): void {
    const closest = event.target && event.target.closest('.e-pagercontainer');
    if (closest) {
      return;
    }
    if (event.data?.length === 0) {
      grid.dataSource.forEach((element: any) => {
        const index = this.selectedItems.map((e) => e[this.idFieldName]).indexOf(element[this.idFieldName]);
        if (index > -1) {
          this.selectedItems.splice(index, 1);
        }
      });
    } else {
      const index = this.selectedItems.map((e) => e[this.idFieldName]).indexOf(event.data[this.idFieldName]);
      if (index > -1) {
        this.selectedItems.splice(index, 1);
      }
    }
  }

  clearSelection(grid: any): void {
    this.selectedItems = [];
    grid.clearSelection();
  }

  addActiveCssClass(event: any): void {
    if (event) {
      event.stopPropagation();
      this.clickedElement = event.currentTarget;
      this.clickedElement.classList.add('e-active');
      this.clickedElement.focus();
    }
  }

  removeActiveCssClass(): void {
    if (this.clickedElement) {
      this.clickedElement.classList.remove('e-active');
      this.clickedElement.focus();
      this.clickedElement = undefined;
    }
  }

  exportSelected(event: any): void {
    if (event.item.properties.id === ExportType['Excel File']) {
      this.defaultExport(ExportedFileType.excel);
    } else if (event.item.properties.id === ExportType['CSV File']) {
      this.defaultExport(ExportedFileType.csv);
    } else if (event.item.properties.id === ExportType['Custom']) {
      this.customExport();
    }
  }

  customExport(): void {
    console.warn('Override customExport() method in child component:');
    console.warn('public override customExport(): void { }');
  }

  defaultExport(fileType: ExportedFileType): void {
    console.warn('Override defaultExport(fileType) method in child component:');
    console.warn('public override defaultExport(fileType): void { }');
  }

  updatePage(): void {
    console.warn('Override updatePage() method in child component:');
    console.warn('public override updatePage(): void { }');
  }

  sortingHandler(args: any): void {
    if (args.columnName) {
      const direction = args.direction === 'Ascending' ? SortingDirections.Ascending : SortingDirections.Descending;
      this.orderBy = args.columnName + ' ' + direction;
    } else {
      this.orderBy = '';
    }
    this.updatePage();
  }

  gridDataBound(grid: any): void {
    if (this.selectedItems.length) {
      const selectedIndexes: number[] = [];
      grid.dataSource.map((item: any, i: number) => {
        if (this.selectedItems.find((selectedItem: any) => selectedItem[this.idFieldName] === item[this.idFieldName])) {
          selectedIndexes.push(i);
        }
      });
      grid.selectRows(selectedIndexes);
    }
  }

  actionBegin(args: PageEventArgs, grid?: any): void {
    if (args.requestType === 'sorting') {
      this.sortingHandler(args);
      grid && this.clearSelection(grid);
      this.refreshing = true;
    }
    if (args.requestType === 'refresh') {
      // prevent double re-render on sorting
      if (this.refreshing) {
        args.cancel = true;
        this.refreshing = false;
      }
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  public onSubrowToggle(event: MouseEvent, data: { index: string }): void {
    event.stopPropagation();
    const index = Number(data.index);
    if (this.subrowsState.has(index)) {
      this.gridWithChildRow.detailRowModule.collapse(index);
      this.subrowsState.delete(index);
    } else {
      this.gridWithChildRow.detailRowModule.expand(Number(data.index));
      this.subrowsState.add(index);
    }
  }

  public refreshGridColumns(columns: GridColumn[], grid: GridComponent): void {
    columns.forEach(g => {
      if (!isNullOrUndefined(grid.getColumnByField(g.fieldName))) {
        grid.getColumnByField(g.fieldName).visible = g.visible;
      }
    });
    grid.refreshColumns();
  }

  protected onSubrowAllToggle(index?: number): void {
    if(index) {
      this.gridWithChildRow.detailRowModule.expandAll();
      this.subrowsState.add(index - 1);
    } else {
      this.gridWithChildRow.detailRowModule.collapseAll();
      this.subrowsState.clear()
    }
  }
}
