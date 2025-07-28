import { Control } from 'ol/control';
import {
  DataStoreService,
  getImageNames,
} from '../../../../core/services/data-store.service';
import { ExcelService } from '../../../../core/services/excel.service';
import { JsonCreator } from '../../../../core/providers/json-creator';
import { LoadPictureService } from '../../../../core/services/load-picture.service';
import { inject } from '@angular/core';
import { GeoCoderService } from '../../../../core/services/geo-coder.service';

const EXPORTED_FILENAME = 'exportedMap';

export class ExportControl extends Control {
  private readonly dataStoreService!: DataStoreService;
  private readonly excelService!: ExcelService;
  private readonly jsonCreatorService!: JsonCreator;
  private readonly loadPictureService!: LoadPictureService;
  private readonly geoCoderService: GeoCoderService;

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
    this.excelService = inject(ExcelService);
    this.jsonCreatorService = inject(JsonCreator);
    this.loadPictureService = inject(LoadPictureService);
    this.geoCoderService = inject(GeoCoderService);

    const exportFiles = async (): Promise<void> => {
      this.geoCoderService.showLoadingSpinner(true);
      const dataStore = this.dataStoreService.getStore();
      if (dataStore.length > 0) {
        const sheet = dataStore.map((data) => {
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
          return {
            ...data,
            ...pictureBlobs,
          };
        });
        await this.excelService.generateExcel(
          sheet,
          EXPORTED_FILENAME + '.xlsx',
          this.loadPictureService
        );
        this.jsonCreatorService.saveJsonFile(
          this.jsonCreatorService.createJson(
            this.loadPictureService.getPicturesStore()
          ),
          EXPORTED_FILENAME + '.json'
        );
      }
      this.geoCoderService.showLoadingSpinner(false);
    };

    button.addEventListener('click', exportFiles.bind(this), false);
  }
}
