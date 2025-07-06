import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GridApi } from 'ag-grid-community';
import {
  DataStoreService,
  StoreData,
} from '../../../../core/services/data-store.service';

@Component({
  selector: 'app-top-buttons',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './top-buttons.component.html',
  styleUrl: './top-buttons.component.scss',
})
export class TopButtonsComponent {
  @Input() gridApi!: GridApi<StoreData>;

  constructor(private readonly dataStoreService: DataStoreService) {}

  close() {
    this.dataStoreService.setEditMode(false);
  }

  clearFilters() {
    this.gridApi.setFilterModel(null);
  }
}
