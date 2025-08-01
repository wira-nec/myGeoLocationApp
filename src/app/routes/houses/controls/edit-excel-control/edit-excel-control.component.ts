import { CloseSearchControlComponent } from '../close-search-control/close-search-control.component';

export class EditExcelControl extends CloseSearchControlComponent {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object = {}) {
    const options = opt_options;
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 20px;" src="assets/table_edit_24dp.png" alt="v" title="Edit excel" />';
    const editElement = document.createElement('div');
    editElement.className = 'edit-excel ol-unselectable ol-control';
    editElement.appendChild(button);

    super({
      element: editElement,
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
