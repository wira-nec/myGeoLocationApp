import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Control } from 'ol/control';
import { BottomFileSelectionSheetComponent } from '../../houses/bottom-file-selection-sheet/bottom-file-selection-sheet.component';

export class ImportFilesControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object) {
    const options = opt_options || {};
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 1em;" src="assets/folder-plus-circle.svg" alt="^" title="Select your import files (excel/foto\'s) to show on the map" />';
    const importElement = document.createElement('div');
    importElement.className = 'import-files ol-unselectable ol-control';
    importElement.appendChild(button);
    super({
      element: importElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (options as any).target,
    });
    if (Object.prototype.hasOwnProperty.call(options, 'callback')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.callBack = (options as any).callback;
      button.addEventListener('click', this.handleImport.bind(this), false);
    }
  }
  private callBack!: MatBottomSheet;

  private handleImport() {
    this.callBack.open(BottomFileSelectionSheetComponent);
  }
}
