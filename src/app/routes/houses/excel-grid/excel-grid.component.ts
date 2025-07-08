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
  FirstDataRenderedEvent,
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
import { TopButtonsComponent } from './top-buttons/top-buttons.component';
import { Subject } from 'rxjs';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-excel-grid',
  standalone: true,
  imports: [
    AgGridAngular,
    OverflowPaneDirective,
    CommonModule,
    TopButtonsComponent,
  ],
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
    minWidth: 60,
    flex: 1,
  };
  inEditMode = false;
  rowData: StoreData[] = [];
  colDefs: ColDef[] = [];
  autoSizeStrategy: SizeColumnsToContentStrategy = {
    type: 'fitCellContents',
  };
  gridApi!: GridApi<StoreData>;
  firstDataRendered$ = new Subject<FirstDataRenderedEvent<StoreData, ColDef>>();
  hostStyle: SafeStyle = '';

  private dataStore: StoreData[] = [];
  private selectedIndex: number | undefined;

  constructor(
    private readonly dataStoreService: DataStoreService,
    private eRef: ElementRef,
    private doms: DomSanitizer
  ) {
    this.inEditMode = this.dataStoreService.isInEditMode();
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
          } else {
            this.selectedIndex = undefined;
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
          // Column Definitions: Defines & controls grid columns.
          this.colDefs = fieldNames.map((fieldName) => ({
            headerName: fieldName,
            field: fieldName,
            hide: fieldName === 'id',
            editable: true,
            cellEditor: 'agTextCellEditor',
            cellEditorParams: {
              maxLength: 100,
            },
          }));
          if (this.selectedIndex !== undefined) {
            // If data from DataStoreService is selected, set the filter model to null and select the row.
            this.gridApi.setFilterModel(null); // Clear any existing filters
          }
          this.gridApi.setGridOption('columnDefs', this.colDefs);
          this.gridApi.setGridOption('rowData', this.rowData);
          if (this.selectedIndex !== undefined) {
            // Select the row based on the selected index.
            this.gridApi
              .getRowNode(this.selectedIndex?.toString())
              ?.setSelected(true);
          } else {
            // deselect any previously selected row.
            this.gridApi.deselectAll();
          }
          setTimeout(() => {
            this.gridApi.autoSizeAllColumns();
            if (this.selectedIndex !== undefined) {
              // Show the page for the selected row.
              const pageSize = this.gridApi.paginationGetPageSize();
              const page = Math.floor((this.selectedIndex || 0) / pageSize); // page is 0 based
              console.log('pageSize', pageSize);
              console.log('selectedIndex', this.selectedIndex);
              console.log('page', page);
              console.log('totalPages', this.gridApi.paginationGetTotalPages());
              this.gridApi.paginationGoToPage(page);
              this.gridApi.ensureIndexVisible(this.selectedIndex);
            } else {
              // If no row is selected, go to the first page.
              this.gridApi.paginationGoToPage(0);
            }
          }, 10);
        }
      });
  }

  onFirstDataRendered($event: FirstDataRenderedEvent<StoreData, ColDef>) {
    this.firstDataRendered$.next($event);
  }

  onGetRowId(params: GetRowIdParams<StoreData, Context>): string {
    // Use the 'id' field from the data as the unique identifier for the row
    return params.data['id'] as string;
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
  onGridStyleChange($event: string) {
    this.hostStyle = this.doms.bypassSecurityTrustStyle($event);
  }
}
