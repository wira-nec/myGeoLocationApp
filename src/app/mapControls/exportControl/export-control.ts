import { Control } from 'ol/control';

export class ExportControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object) {
    const options = opt_options || {};
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 1em;" src="assets/icons8-export-excel-24.png" alt="v" title="Export converted excel sheet, containing location information" />';
    const importElement = document.createElement('div');
    importElement.className = 'export-file ol-unselectable ol-control';
    importElement.appendChild(button);
    super({
      element: importElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (options as any).target,
    });
    if (Object.prototype.hasOwnProperty.call(options, 'callback')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.callBack = (options as any).callback;
      button.addEventListener('click', this.callBack.bind(this), false);
    }
  }
  private callBack!: () => void;
}
