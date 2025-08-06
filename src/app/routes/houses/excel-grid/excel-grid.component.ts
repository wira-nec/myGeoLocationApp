import { Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellValueChangedEvent,
  ColDef,
  Context,
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
  ERROR,
  GEO_INFO,
  getAllHeaderInfo,
  getComparableAddress,
  getImageName,
  getPictureColumnName,
  hasPictures,
  LATITUDE,
  LONGITUDE,
  SHEET_NAME,
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
import { ToasterService } from '../../../core/services/toaster.service';
import { blobsFilter } from '../../../core/helpers/dataManipulations';
import { ResizeElementDirective } from '../../../directives/resize-element.directive';
import { GeoBoxSelectionService } from '../../../core/services/geo-box-selection.service';
import { STORE_DATA_ID_PROPERTY } from '../providers/markers';

ModuleRegistry.registerModules([AllCommunityModule]);

const CLASS_FOR_PICTURE_CELL = 'picture-cell';
const COLUMN_CLASS = 'column-class';

export const ZOOM_IN_COLUMN_NAME = 'zoomIn';

const nonGridColumnNames = [GEO_INFO, LONGITUDE, LATITUDE, SHEET_NAME, ERROR];

@Component({
  selector: 'app-excel-grid',
  standalone: true,
  imports: [
    AgGridAngular,
    OverflowPaneDirective,
    ResizeElementDirective,
    CommonModule,
    TopButtonsComponent,
  ],
  templateUrl: './excel-grid.component.html',
  styleUrl: './excel-grid.component.scss',
})
export class ExcelGridComponent {
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
  firstDataRendered$ = new Subject<void>();
  hostStyle: SafeStyle = '';

  private dataStore: StoreData[] = [];

  constructor(
    private readonly pictureService: LoadPictureService,
    private readonly dataStoreService: DataStoreService,
    private readonly geoCoderService: GeoCoderService,
    private readonly toaster: ToasterService,
    private readonly geoBoxSelectionService: GeoBoxSelectionService,
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
    const boxSelectionSubscription = this.watchOnBoxSelection();
    this.destroyRef.onDestroy(() => {
      gridRendererSubscription.unsubscribe();
      editModeSubscription.unsubscribe();
      dataStoreServiceSubscription.unsubscribe();
      boxSelectionSubscription.unsubscribe();
    });
  }

  private watchOnBoxSelection() {
    return this.geoBoxSelectionService.featureSelection$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((features) => {
        const selectedData: StoreData[] = [];
        features.forEach((feature) => {
          const data = this.dataStoreService.findById(
            feature.get(STORE_DATA_ID_PROPERTY) as string
          );
          if (data) {
            selectedData.push(data);
          }
        });
        if (selectedData.length) {
          this.createGridData(selectedData);
        } else {
          this.createGridData(this.dataStoreService.getStore());
          this.dataStoreService.setEditMode(false);
        }
        this.autoSizeColumnsAndPaging(0);
        // this will reset top buttons
        this.firstDataRendered$.next();
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
          this.createGridData(this.dataStoreService.getStore());
          // this will reset top buttons
          this.firstDataRendered$.next();
        } else if (data.length === 1) {
          // Only 1 update, so it's assumed this is due to an single row update in the excel grid
          let newRowData = this.rowData.find(
            (row) => row[UNIQUE_ID] === data[0][UNIQUE_ID]
          );
          if (newRowData) {
            // If there exists new columns in the received data, then add these columns also to the rowData
            const dataColumns = Object.keys(data[0]);
            const rowDataColumns = this.colDefs.map((colDef) => colDef.field);
            const newColumns = dataColumns.filter(
              (colName) =>
                !rowDataColumns.includes(colName) &&
                !nonGridColumnNames.includes(colName)
            );
            newColumns.forEach((colName) => {
              // Add column to rowData
              newRowData = {
                ...newRowData,
                [colName]: data[0][colName],
              };
              // Add column to colDefs
              // Note: the only columns that can be added are picture columns
              this.colDefs.push(
                this.createPictureColDef([colName, true /* Don't care */])
              );
            });
            newRowData = {
              ...newRowData,
              ...this.convertToGridRowData(data[0]),
            };
            // check if new column is added, could be the case as first picture is added in popup!!!!
            newRowData = {
              ...newRowData,
              ...this.convertPictureNamesToBlob(newRowData),
            };
            // Update the columns in the grid
            if (newColumns.length) {
              this.gridApi.updateGridOptions({
                columnDefs: this.colDefs,
              });
            }
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

  private createGridData(data: StoreData[]) {
    this.dataStore = data;
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
        geoDecoderService: this.geoCoderService,
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
      .filter(
        (colDef) =>
          colDef.cellClass === CLASS_FOR_PICTURE_CELL &&
          !blobsFilter(row[colDef.headerName as string] || '')
      )
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

  onFirstDataRendered() {
    this.firstDataRendered$.next();
  }

  onGetRowId(params: GetRowIdParams<StoreData, Context>): string {
    // Use the 'id' field from the data as the unique identifier for the row
    return params.data[UNIQUE_ID] as string;
  }

  private storePictureNameInData(newPictureName: string, data: StoreData) {
    const pictureColumnName = getPictureColumnName(data);
    data[pictureColumnName] = newPictureName;
    this.dataStoreService.updateStoreData(data);
  }

  onCellValueChanged(event: CellValueChangedEvent<StoreData>): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { zoomIn, ...gridData } = event.data;
    // Update the data store with the modified data
    const result = this.dataStoreService.storeGridData(gridData);
    if (result?.storeData && result?.originalData) {
      const gridAddress = getComparableAddress(result.originalData);
      const storeAddress = getComparableAddress(result.storeData);
      // check if address is changed and if so add a copy of the current picture under new name in pictureStore
      if (gridAddress !== storeAddress) {
        // We need to request the location again since address is changed
        this.gridApi.setGridOption('loading', true);
        this.geoCoderService.requestLocationAsync(result.storeData).then(
          () => {
            // onfulfilled commit data store again with latest data store data
            const updatedDataAfterLocationRequest =
              this.dataStoreService.findById(result.storeData[UNIQUE_ID]);
            if (updatedDataAfterLocationRequest) {
              const newPictureName =
                getImageName(updatedDataAfterLocationRequest) || '';
              if (hasPictures(result.originalData)) {
                // when location is not changed, update key to related related picture
                if (!this.pictureService.getPicture(newPictureName)) {
                  if (
                    updatedDataAfterLocationRequest[LONGITUDE] ===
                      result.originalData[LONGITUDE] &&
                    updatedDataAfterLocationRequest[LATITUDE] ===
                      result.originalData[LATITUDE]
                  ) {
                    // location is not changed, only the address has changed
                    // lets check if there is a picture blob for it or not.
                    // In that case rename key for original blob
                    const originalPictureName = getImageName(
                      result.originalData
                    );
                    if (originalPictureName) {
                      this.pictureService.changePictureKey(
                        originalPictureName,
                        newPictureName
                      );
                      this.dataStoreService.updateDataStoreWithPicture(
                        Number(updatedDataAfterLocationRequest[UNIQUE_ID]),
                        [newPictureName]
                      );
                    }
                  } else {
                    // location is changed and there is no picture for it
                    // remove picture data from data store
                    this.storePictureNameInData(
                      '',
                      updatedDataAfterLocationRequest
                    );
                  }
                } else {
                  // There is a picture, so put it back in the store data
                  this.storePictureNameInData(
                    newPictureName,
                    updatedDataAfterLocationRequest
                  );
                }
              } else if (this.pictureService.getPicture(newPictureName)) {
                // There is a picture for the updated store data, so update data store with picture name
                this.storePictureNameInData(
                  newPictureName,
                  updatedDataAfterLocationRequest
                );
              }
              this.dataStoreService.commit([updatedDataAfterLocationRequest]);
              this.gridApi.setGridOption('loading', false);
            } else {
              this.gridApi.setGridOption('loading', false);
              this.errorOnCellValueChanged('Failed to update the data', result);
            }
          },
          (err) => {
            // something went wrong, restore to original data
            this.gridApi.setGridOption('loading', false);
            this.errorOnCellValueChanged(err.message, result);
          }
        );
      } else {
        this.dataStoreService.commit([result.storeData]);
      }
    } else {
      this.toaster.show('error', 'Failed to update the data');
    }
  }

  private errorOnCellValueChanged(
    err: string,
    result: { storeData: StoreData; originalData: StoreData }
  ) {
    this.dataStoreService.changeStoreData(result.originalData);
    this.toaster.show('error', err);
  }

  onRowSelected(event: RowSelectedEvent<StoreData, ColDef>): void {
    this.dataStoreService.setSelectedData(event.data);
  }
  onGridStyleChange($event: string) {
    this.hostStyle = this.doms.bypassSecurityTrustStyle($event);
  }
}
