import { Control } from 'ol/control';

export class EditExcelControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object = {}) {
    const options = opt_options;
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 20px;" src="assets/table_edit_24dp.png" alt="v" title="Edit excel" />';
    const centerElement = document.createElement('div');
    centerElement.className = 'edit-excel ol-unselectable ol-control';
    centerElement.appendChild(button);

    super({
      element: centerElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (options as any).target,
    });

    button.addEventListener(
      'click',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options as any).callback.bind(this),
      false
    );
  }
}
