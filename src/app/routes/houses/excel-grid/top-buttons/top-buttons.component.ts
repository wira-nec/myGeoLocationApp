import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  CellValueChangedEvent,
  ColumnMovedEvent,
  FilterChangedEvent,
  GridApi,
  SortChangedEvent,
} from 'ag-grid-community';
import {
  DataStoreService,
  StoreData,
} from '../../../../core/services/data-store.service';
import { StorageService } from '../../../../core/services/storage-service.service';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ZOOM_IN_COLUMN_NAME } from '../excel-grid.component';

@Component({
  selector: 'app-top-buttons',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatCheckboxModule,
  ],
  templateUrl: './top-buttons.component.html',
  styleUrl: './top-buttons.component.scss',
})
export class TopButtonsComponent implements OnInit {
  @Input() gridApi!: GridApi<StoreData>;
  @Input() cellValueChangedEvent$!: Subject<CellValueChangedEvent<StoreData>>;
  @Input() firstDataRendered$!: Subject<void>;
  @Output() gridStyleChange = new EventEmitter<string>();

  private readonly destroyRef = inject(DestroyRef);

  undoCounter = 0;
  redoCounter = 0;
  disableUndoButton = false;
  disableRedoButton = false;
  isPrinting = false;
  checkedAllPages = false;

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.firstDataRendered$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onFirstDataRendered();
      });
  }

  onFirstDataRendered() {
    this.undoCounter = 0;
    this.redoCounter = 0;
    this.disableUndoButton = false;
    this.disableRedoButton = false;
    const onSortChanged = this.gridApi.getGridOption('onSortChanged');
    const onColumnMoved = this.gridApi.getGridOption('onColumnMoved');
    const onFilterChanged = this.gridApi.getGridOption('onFilterChanged');
    const onCellValueChanged = this.gridApi.getGridOption('onCellValueChanged');
    this.gridApi.updateGridOptions({
      onSortChanged: (evt) => this.onSortChanged(onSortChanged, evt),
      onColumnMoved: (evt) => this.onColumnMoved(onColumnMoved, evt),
      onFilterChanged: (evt) => this.onFilterChanged(onFilterChanged, evt),
      onCellValueChanged: (evt) =>
        this.onCellValueChanged(onCellValueChanged, evt),
    });
  }

  close() {
    this.dataStoreService.setEditMode(false);
  }

  clearFilters() {
    this.gridApi.setFilterModel(null);
    this.updateRedoUndoSettings();
  }

  saveSettings() {
    this.storageService.saveData(
      'ColumnState',
      this.gridApi
        .getColumnState()
        .map((col) => JSON.stringify(col))
        .join('~')
    );
    this.updateRedoUndoSettings();
  }

  restoreSettings() {
    if (!this.storageService.hasData('ColumnState')) {
      console.log('no columns state to restore by, you must save state first');
      return;
    }
    this.gridApi.applyColumnState({
      state: this.storageService
        .getData('ColumnState')
        .split('~')
        .map((col: string) => JSON.parse(col)),
      applyOrder: true,
    });
    this.updateRedoUndoSettings();
  }

  resetSettings() {
    this.gridApi.resetColumnState();
    setTimeout(() => {
      this.gridApi.autoSizeAllColumns();
    }, 10);
    this.updateRedoUndoSettings();
  }

  undo() {
    this.gridApi.undoCellEditing();
  }

  redo() {
    this.gridApi.redoCellEditing();
  }
  onCheckAllPages() {
    this.checkedAllPages = !this.checkedAllPages;
    this.showPaging();
  }

  onBtnExport() {
    this.gridApi.exportDataAsCsv({
      allColumns: false,
    });
  }

  onCellValueChanged(
    callback: ((event: CellValueChangedEvent<StoreData>) => void) | undefined,
    evt: CellValueChangedEvent<StoreData>
  ) {
    if (callback) {
      callback(evt); // Call the original onCellValueChanged callback if it exists
    }
    this.updateRedoUndoSettings();
  }

  onSortChanged(
    callback: ((event: SortChangedEvent) => void) | undefined,
    evt: SortChangedEvent
  ) {
    if (callback) {
      callback(evt); // Call the original onSortChanged callback if it exists
    }
    this.updateRedoUndoSettings();
  }

  onColumnMoved(
    callback: ((event: ColumnMovedEvent) => void) | undefined,
    evt: ColumnMovedEvent
  ) {
    if (callback) {
      callback(evt); // Call the original onColumnMoved callback if it exists
    }
    this.updateRedoUndoSettings();
  }

  onFilterChanged(
    callback: ((event: FilterChangedEvent) => void) | undefined,
    evt: FilterChangedEvent
  ) {
    if (callback) {
      callback(evt); // Call the original onFilterChanged callback if it exists
    }
    this.updateRedoUndoSettings();
  }

  onBtPrint() {
    this.setPrinterFriendly();
    setTimeout(() => {
      print();
      this.setNormal();
    }, 2000);
  }

  private updateRedoUndoSettings() {
    this.undoCounter = this.gridApi.getCurrentUndoSize();
    this.redoCounter = this.gridApi.getCurrentRedoSize();
    this.disableUndoButton = this.undoCounter < 1;
    this.disableRedoButton = this.redoCounter < 1;
  }

  private originalStyle: string | undefined;
  private currentSelectedPage: number | undefined;

  private setPrinterFriendly() {
    this.gridApi.setColumnsVisible([ZOOM_IN_COLUMN_NAME], false);
    this.showPaging();
    this.isPrinting = true;
    const cssText = `
      display: table !important;
      width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      z-index: 2000 !important;
      overflow: hidden !important;
      background: white !important;
    `;
    this.gridStyleChange.emit(cssText);

    setTimeout(() => {
      // Ensure the grid is fully rendered before applying styles
      const eGridDiv = document.querySelector<HTMLElement>(
        '#section-to-print'
      )! as HTMLElement;
      this.originalStyle = eGridDiv.style.cssText;
      eGridDiv.style.width = '';
      eGridDiv.style.height = '';

      this.gridApi.updateGridOptions({ domLayout: 'print' });
    }, 100);
  }
  private showPaging() {
    this.currentSelectedPage = this.gridApi.paginationGetCurrentPage();
    if (this.checkedAllPages) {
      this.gridApi.updateGridOptions({ pagination: false });
    } else {
      this.gridApi.updateGridOptions({
        pagination: true,
        paginationAutoPageSize: false,
        paginationPageSize: this.gridApi.paginationGetPageSize(),
      });
      this.gridApi.paginationGoToPage(this.currentSelectedPage);
    }
  }

  private setNormal() {
    this.gridStyleChange.emit('');
    this.gridApi.setColumnsVisible([ZOOM_IN_COLUMN_NAME], true);
    if (this.checkedAllPages) {
      this.gridApi.updateGridOptions({ pagination: false });
    } else {
      this.gridApi.updateGridOptions({
        pagination: true,
        paginationAutoPageSize: true,
      });
      if (this.currentSelectedPage) {
        this.gridApi.paginationGoToPage(this.currentSelectedPage);
      }
    }
    setTimeout(() => {
      // Ensure the grid is fully rendered before resetting styles
      const eGridDiv = document.querySelector<HTMLElement>(
        '#section-to-print'
      )! as HTMLElement;
      eGridDiv.style.cssText = this.originalStyle || '';
      this.gridApi.setGridOption('domLayout', undefined);
      this.isPrinting = false;
    }, 100);
  }
}
