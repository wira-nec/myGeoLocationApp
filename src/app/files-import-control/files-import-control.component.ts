import { Component, ElementRef, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FilesImportControl } from '../mapControls/ImportControl/import-control';
import { BottomFileSelectionSheetComponent } from '../houses/bottom-file-selection-sheet/bottom-file-selection-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-files-import-control',
  standalone: true,
  imports: [MatIcon, MatTooltipModule],
  templateUrl: './files-import-control.component.html',
  styleUrl: './files-import-control.component.scss',
})
export class FilesImportControlComponent {
  private _bottomSheet = inject(MatBottomSheet);

  constructor(private readonly elementRef: ElementRef) {}

  getFilesImportControl() {
    return new FilesImportControl(this.elementRef);
  }

  openBottomSheet(): void {
    this._bottomSheet.open(BottomFileSelectionSheetComponent);
  }
}
