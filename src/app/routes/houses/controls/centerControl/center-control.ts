import { fromLonLat } from 'ol/proj';
import { CloseSearchControlComponent } from '../close-search-control/close-search-control.component';

export class CenterControl extends CloseSearchControlComponent {
  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object = {}) {
    const options = opt_options;
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 20px;" src="assets/location_searching_24dp.png" alt="v" title="Center map on Nijkerk" />';
    const centerElement = document.createElement('div');
    centerElement.className = 'center-map ol-unselectable ol-control';
    centerElement.appendChild(button);

    super({
      element: centerElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (options as any).target,
    });

    const centerMap = () => {
      const map = this.getMap();
      if (map) {
        map.getView().animate({
          center: fromLonLat([5.4808, 52.2211]),
          zoom: 11,
        });
      }
    };
    button.addEventListener('click', centerMap.bind(this), false);
  }
}
