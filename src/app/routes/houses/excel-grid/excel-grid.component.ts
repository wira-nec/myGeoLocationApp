import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellValueChangedEvent,
  ColDef,
  Context,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  RowSelectedEvent,
  RowSelectionOptions,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import {
  DataStoreService,
  getAllKeys,
  StoreData,
} from '../../../core/services/data-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OverflowPaneDirective } from '../../../directives/overflow-pane.directive';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { isEqual } from 'lodash';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-excel-grid',
  standalone: true,
  imports: [AgGridAngular, OverflowPaneDirective, CommonModule],
  templateUrl: './excel-grid.component.html',
  styleUrl: './excel-grid.component.scss',
})
export class ExcelGridComponent {
  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.eRef.nativeElement.contains(event.target)) {
      // clicked inside
    } else {
      // clicked outside
      this.dataStoreService.setEditMode(false);
    }
  }
  private readonly destroyRef = inject(DestroyRef);

  defaultColDef: ColDef = {
    filter: true,
    minWidth: 100,
    flex: 1,
  };
  inEditMode = false;
  rowData: StoreData[] = [];
  colDefs: ColDef[] = [];
  autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
  };
  gridApi!: GridApi<StoreData>;

  private dataStore: StoreData[] = [];
  private selectedIndex: number | undefined;

  constructor(
    private readonly dataStoreService: DataStoreService,
    private eRef: ElementRef
  ) {
    this.inEditMode = this.dataStoreService.isInEditMode();
  }
  private transformDataKeys(obj: StoreData) {
    return Object.keys(obj).reduce(function (o: StoreData, prop) {
      const value = obj[prop];
      const newProp = prop.replace('.', ' ');
      o[newProp] = value;
      return o;
    }, {});
  }

  rowSelection = (): RowSelectionOptions => ({
    mode: 'singleRow',
    checkboxes: false,
    enableClickSelection: true,
  });

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.dataStoreService.editMode$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (editMode) => {
        this.inEditMode = editMode;
        if (editMode) {
          this.dataStore = this.dataStoreService.getStore();
          const selectedData = this.dataStoreService.getSelectedData();
          if (selectedData) {
            // If data is selected, filter the data store to only include the selected data.
            this.selectedIndex = this.dataStore.findIndex((data) =>
              isEqual(data, selectedData)
            );
          }
          // Row Data: The data to be displayed.
          this.rowData = this.dataStore.map((data, index) => {
            const {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              geoPositionInfo,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              longitude,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              latitude,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              error,
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              sheetName,
              ...restAll
            } = data;
            return {
              id: index.toString(),
              ...restAll,
            };
          });
          const fieldNames = getAllKeys(this.rowData);
          this.rowData = this.rowData.map((data) =>
            this.transformDataKeys(data)
          );
          // Column Definitions: Defines & controls grid columns.
          this.colDefs = fieldNames.map((fieldName) => ({
            headerName: fieldName,
            field: fieldName.replace('.', ' '),
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellEditorParams: {
              maxLength: 20,
            },
          }));
          this.gridApi.setGridOption('columnDefs', this.colDefs);
          this.gridApi.setGridOption('rowData', this.rowData);
          if (this.selectedIndex) {
            this.gridApi
              .getRowNode(this.selectedIndex?.toString())
              ?.setSelected(true);
          }
          setTimeout(() => {
            this.gridApi.autoSizeAllColumns();
          }, 10);
          setTimeout(() => {
            if (this.selectedIndex !== undefined) {
              // If a row is selected, scroll to that row and select it.
              this.gridApi.ensureIndexVisible(this.selectedIndex, 'middle');
            }
          }, 20);
        }
      });
  }

  onGetRowId(params: GetRowIdParams<StoreData, Context>): string {
    // Use the 'id' field from the data as the unique identifier for the row
    return params.data['id'];
  }

  onCellValueChanged(event: CellValueChangedEvent<StoreData>): void {
    const updatedData = event.data;
    // Update the data store with the modified data
    this.dataStoreService.updateData(updatedData);
    // If in edit mode, update the rowData to reflect changes
    if (this.inEditMode) {
      this.rowData = this.dataStoreService.getStore().map((data, index) => {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          geoPositionInfo,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          longitude,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          latitude,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          error,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          sheetName,
          ...restAll
        } = data;
        return {
          id: index.toString(),
          ...restAll,
        };
      });
    }
  }

  onRowSelected(event: RowSelectedEvent<StoreData, ColDef>): void {
    this.dataStoreService.setSelectedData(event.data);
  }

  onFirstDataRendered = () => {
    if (this.inEditMode && this.selectedIndex !== undefined) {
      setTimeout(() => {
        const pageSize = this.gridApi.paginationGetPageSize();
        const page = Math.floor(this.rowData.length / pageSize) - 1;
        // Show the page for the selected row.
        console.log('page', page);
        console.log('totalPages', this.gridApi.paginationGetTotalPages());
        this.gridApi.paginationGoToPage(page);
      }, 100);
    }
  };
}
