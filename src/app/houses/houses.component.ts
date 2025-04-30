import { Component, inject, OnInit } from '@angular/core';
import { HousesMapComponent } from '../houses-map/houses-map.component';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BottomFileSelectionSheetComponent } from './bottom-file-selection-sheet/bottom-file-selection-sheet.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-houses',
  standalone: true,
  imports: [HousesMapComponent, MatIcon, CommonModule, MatTooltipModule],
  templateUrl: './houses.component.html',
  styleUrl: './houses.component.scss',
})
export class HousesComponent implements OnInit {
  ngOnInit(): void {
    this.openBottomSheet();
  }
  private _bottomSheet = inject(MatBottomSheet);

  openBottomSheet(): void {
    this._bottomSheet.open(BottomFileSelectionSheetComponent);
  }
}
