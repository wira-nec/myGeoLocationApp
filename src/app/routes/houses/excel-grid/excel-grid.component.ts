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
  ITooltipParams,
  RowSelectedEvent,
  RowSelectionOptions,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import {
  DataStoreService,
  getAllHeaderInfo,
  StoreData,
  UNIQUE_ID,
} from '../../../core/services/data-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OverflowPaneDirective } from '../../../directives/overflow-pane.directive';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { TopButtonsComponent } from './top-buttons/top-buttons.component';
import { Subject } from 'rxjs';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ImageCellRendererComponent } from './image-cell-renderer/image-cell-renderer.component';
import { LoadPictureService } from '../../../core/services/load-picture.service';
import { ZoomInButtonCellRendererComponent } from './zoom-in-button-cell-renderer/zoom-in-button-cell-renderer.component';
import { GeoCoderService } from '../../../core/services/geo-coder.service';

ModuleRegistry.registerModules([AllCommunityModule]);

const CLASS_FOR_PICTURE_CELL = 'picture-cell';
const COLUMN_CLASS = 'column-class';

export const ZOOM_IN_COLUMN_NAME = 'zoomIn';

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

  constructor(
    private readonly pictureService: LoadPictureService,
    private readonly dataStoreService: DataStoreService,
    private readonly geoDecoderService: GeoCoderService,
    private eRef: ElementRef,
    private doms: DomSanitizer
  ) {}

  rowSelection = (): RowSelectionOptions => ({
    mode: 'singleRow',
    checkboxes: false,
    enableClickSelection: true,
  });

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    const gridRendererSubscription = this.watchOnFirstGridRender();
    const editModeSubscription = this.watchEditMode();
    const dataStoreServiceSubscription =
      this.watchDataUpdatesToUpdateGridContent();
    this.destroyRef.onDestroy(() => {
      gridRendererSubscription.unsubscribe();
      editModeSubscription.unsubscribe();
      dataStoreServiceSubscription.unsubscribe();
    });
  }

  private watchOnFirstGridRender() {
    return this.firstDataRendered$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.rowData.length) {
          this.createRowData();
        } else {
          this.loadDataInGrid();
        }
      });
  }

  private watchDataUpdatesToUpdateGridContent() {
    return this.dataStoreService.dataStore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data.length > 1) {
          this.createGridData();
          this.loadDataInGrid();
        } else if (data.length === 1) {
          // Only 1 update, so it's assumed this is due to a single data update
          let newRowData = this.rowData.find(
            (row) => row[UNIQUE_ID] === data[0][UNIQUE_ID]
          );
          if (newRowData) {
            newRowData = {
              ...newRowData,
              ...this.convertToGridRowData(data[0]),
            };
            newRowData = {
              ...newRowData,
              ...this.convertPictureNamesToBlob(newRowData),
            };
            // Doing the update for the data in the grid in this way is preferred
            // above updating this.rowData because this way the grid is re-rendered
            this.gridApi.forEachNode((rowNode) => {
              if (newRowData && rowNode.id === newRowData['id']) {
                rowNode.setData(newRowData);
              }
            });
          }
        }
      });
  }

  private watchEditMode() {
    return this.dataStoreService.editMode$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((editMode) => {
        this.inEditMode = editMode && this.dataStore.length > 0;
        if (this.inEditMode) {
          const selectedIndex = this.handleSelection();
          if (selectedIndex !== undefined) {
            // If row is selected, set the filter model to null and select the row.
            this.gridApi.setFilterModel(null); // Clear any existing filters
          }
          this.autoSizeColumnsAndPaging(Number(selectedIndex || 0));
        }
      });
  }

  private createGridData() {
    this.dataStore = this.dataStoreService.getStore();
    // Row Data: The data to be displayed.
    this.createRowData();
    // Load grid with new data.
    this.loadDataInGrid();
  }

  private loadDataInGrid() {
    this.gridApi.updateGridOptions({
      columnDefs: this.colDefs,
      rowData: this.rowData,
      context: {
        geoDecoderService: this.geoDecoderService,
        dataStoreService: this.dataStoreService,
      },
    });
  }

  private handleSelection() {
    const selectedIndex = this.dataStoreService.getSelectedData();
    if (selectedIndex !== undefined) {
      // Select the row based on the selected index.
      this.gridApi.getRowNode(selectedIndex?.toString())?.setSelected(true);
    } else {
      // deselect any previously selected row.
      this.gridApi.deselectAll();
    }
    return selectedIndex;
  }

  private autoSizeColumnsAndPaging(selectedIndex?: number) {
    setTimeout(() => {
      this.gridApi.autoSizeAllColumns();
      if (selectedIndex !== undefined) {
        // Show the page for the selected row.
        const pageSize = this.gridApi.paginationGetPageSize();
        const page = Math.floor((selectedIndex || 0) / pageSize); // page is 0 based
        this.gridApi.paginationGoToPage(page);
        this.gridApi.ensureIndexVisible(selectedIndex);
      } else {
        // If no row is selected, go to the first page.
        this.gridApi.paginationGoToPage(0);
      }
    }, 10);
  }

  private createColDefs(rowData: StoreData[]) {
    const fieldInfo = getAllHeaderInfo(rowData);
    // Column Definitions: Defines & controls grid columns.
    this.colDefs = fieldInfo.map((info) => {
      if (info[0] === ZOOM_IN_COLUMN_NAME) {
        return this.createZoomInColDef();
      } else if (!info[1]) {
        return this.createDefaultColDef(info);
      } else {
        return this.createPictureColDef(info);
      }
    });
  }

  private createZoomInColDef(): ColDef {
    return {
      field: ZOOM_IN_COLUMN_NAME,
      headerName: 'Goto',
      editable: false,
      filter: false,
      sortable: false,
      cellRenderer: ZoomInButtonCellRendererComponent,
      width: 50,
    };
  }

  private createPictureColDef(info: [string, boolean]): ColDef {
    return {
      headerName: info[0],
      field: info[0],
      editable: false,
      filter: false,
      sortable: false,
      headerTooltip: info[0],
      tooltipValueGetter: (p: ITooltipParams) => {
        return (
          this.pictureService.getPictureName(p.value) || 'No picture found'
        );
      },
      cellRenderer: ImageCellRendererComponent,
      cellClass: CLASS_FOR_PICTURE_CELL,
      minWidth: 20,
    };
  }

  private createDefaultColDef(info: [string, boolean]): ColDef {
    return {
      headerName: info[0],
      field: info[0],
      hide: info[0] === UNIQUE_ID,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 100,
      },
      headerTooltip: info[0],
      tooltipValueGetter: (p: ITooltipParams) => p.value,
      cellClass: COLUMN_CLASS,
    };
  }

  private convertPictureNamesToBlob(row: StoreData): StoreData {
    const convertedRow = this.colDefs
      .filter((colDef) => colDef.cellClass === CLASS_FOR_PICTURE_CELL)
      .map(
        (col) =>
          ({
            [col.headerName as string]: this.pictureService.getPicture(
              (row[col.headerName as string] || '').toLowerCase()
            ),
          } as StoreData)
      );
    return Object.assign({}, ...convertedRow);
  }

  private createRowData() {
    const rowData = this.getRowDataForGrid();
    this.createColDefs(rowData);
    this.rowData = rowData.map((row) => ({
      ...row,
      ...this.convertPictureNamesToBlob(row),
    }));
  }

  private convertToGridRowData(data: StoreData) {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      geoPositionInfo,
      longitude,
      latitude,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      error,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sheetName,
      ...restAll
    } = data;
    return {
      [ZOOM_IN_COLUMN_NAME]: [longitude, latitude].join(','),
      ...restAll,
    };
  }

  private getRowDataForGrid(): StoreData[] {
    return this.dataStore.map((data) => this.convertToGridRowData(data));
  }

  onFirstDataRendered($event: FirstDataRenderedEvent<StoreData, ColDef>) {
    this.firstDataRendered$.next($event);
  }

  onGetRowId(params: GetRowIdParams<StoreData, Context>): string {
    // Use the 'id' field from the data as the unique identifier for the row
    return params.data[UNIQUE_ID] as string;
  }

  onCellValueChanged(event: CellValueChangedEvent<StoreData>): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { zoomIn, ...updatedData } = event.data;
    // Update the data store with the modified data
    this.dataStoreService.storeGridData(updatedData);
  }

  onRowSelected(event: RowSelectedEvent<StoreData, ColDef>): void {
    this.dataStoreService.setSelectedData(event.data);
  }
  onGridStyleChange($event: string) {
    this.hostStyle = this.doms.bypassSecurityTrustStyle($event);
  }
}
