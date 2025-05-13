import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Control } from 'ol/control';
import { BottomFileSelectionSheetComponent } from '../../houses/bottom-file-selection-sheet/bottom-file-selection-sheet.component';
import { inject } from '@angular/core';

export class ImportFilesControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object = {}) {
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 1em;" src="assets/folder-plus-circle.svg" alt="^" title="Select your import files (excel/foto\'s) to show on the map" />';
    const importElement = document.createElement('div');
    importElement.className = 'import-files ol-unselectable ol-control';
    importElement.appendChild(button);
    super({
      element: importElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (opt_options as any).target,
    });
    const bottomSheet = inject(MatBottomSheet);
    const handleImport = () =>
      bottomSheet.open(BottomFileSelectionSheetComponent);
    button.addEventListener('click', handleImport.bind(this), false);
    handleImport();
  }
}
