import { Control } from 'ol/control';
import {
  DataStoreService,
  getAddress,
  getImageNames,
} from '../../../../core/services/data-store.service';
import { GeoPositionService } from '../../../../core/services/geo-position.service';
import { ExcelService } from '../../../../core/services/excel.service';
import { JsonCreator } from '../../../../core/providers/json-creator';
import { LoadPictureService } from '../../../../core/services/load-picture.service';
import { inject } from '@angular/core';

const EXPORTED_FILENAME = 'exportedMap';

export class ExportControl extends Control {
  private dataStoreService!: DataStoreService;
  private geoPositionService!: GeoPositionService;
  private excelService!: ExcelService;
  private jsonCreatorService!: JsonCreator;
  private loadPictureService!: LoadPictureService;

  /**
   * @param {Object} [opt_options] Control options.
   */
  constructor(opt_options: object = {}) {
    const options = opt_options;
    const button = document.createElement('button');
    button.innerHTML =
      '<img style="height: 20px;" src="assets/icons8-export-excel-24.png" alt="v" title="Export converted excel sheet, containing location information" />';
    const importElement = document.createElement('div');
    importElement.className = 'export-file ol-unselectable ol-control';
    importElement.appendChild(button);

    super({
      element: importElement,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target: (options as any).target,
    });

    this.dataStoreService = inject(DataStoreService);
    this.geoPositionService = inject(GeoPositionService);
    this.excelService = inject(ExcelService);
    this.jsonCreatorService = inject(JsonCreator);
    this.loadPictureService = inject(LoadPictureService);

    const exportFiles = (): void => {
      const dataStore = this.dataStoreService.getStore();
      if (dataStore.length > 0) {
        const sheet = dataStore.map((data) => {
          const [street, houseNumber, city, postcode] = getAddress(data);
          const pictureNames = getImageNames(data);
          let pictureBlobs = {};
          if (pictureNames.length > 0) {
            pictureNames.forEach((name) => {
              const blob = this.loadPictureService.getPicture(name);
              if (blob !== name) {
                pictureBlobs = {
                  ...pictureBlobs,
                  [name]: blob,
                };
              }
            });
          }
          const geoPos = this.geoPositionService.getGeoPositionByAddress(
            city,
            postcode,
            houseNumber,
            street
          );
          if (geoPos) {
            return {
              ...data,
              longitude: geoPos.coords.longitude.toString(),
              latitude: geoPos.coords.latitude.toString(),
              geoPositionInfo: geoPos.geoPositionInfo,
              ...pictureBlobs,
            };
          } else {
            return {
              ...data,
              error: `Different address was found for ${postcode} ${houseNumber}, ${city}, please verify the address in the excel sheet`,
            };
          }
        });
        this.excelService.generateExcel(sheet, EXPORTED_FILENAME + '.xlsx');
        this.jsonCreatorService.saveJsonFile(
          this.jsonCreatorService.createJson(
            this.loadPictureService.getPicturesStore()
          ),
          EXPORTED_FILENAME + '.json'
        );
      }
    };

    button.addEventListener('click', exportFiles.bind(this), false);
  }
}
