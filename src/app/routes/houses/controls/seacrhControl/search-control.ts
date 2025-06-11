import { Control } from 'ol/control';

export class SearchControl extends Control {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object = {}) {
    const options = opt_options;
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 20px;" src="assets/icons8-magnifier-50.png" alt="v" title="Search location" />';
    const centerElement = document.createElement('div');
    centerElement.className = 'magnifier ol-unselectable ol-control';
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
