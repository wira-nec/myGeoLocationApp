import { Control } from 'ol/control';
import { DataStoreService } from '../../../services/data-store.service';
import { UserPositionService } from '../../../services/user-position.service';
import { ExcelService } from '../../../services/excel.service';
import { JsonCreatorService } from '../../../services/json-creator.service';
import { LoadPictureService } from '../../../services/load-picture.service';
import { FIXED_DETAIL_COLUMNS } from '../../../services/data-store.service';
import { inject } from '@angular/core';

const EXPORTED_FILENAME = 'exportedMap';

export class ExportControl extends Control {
  private dataStoreService!: DataStoreService;
  private userPositionService!: UserPositionService;
  private excelService!: ExcelService;
  private jsonCreatorService!: JsonCreatorService;
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
    this.userPositionService = inject(UserPositionService);
    this.excelService = inject(ExcelService);
    this.jsonCreatorService = inject(JsonCreatorService);
    this.loadPictureService = inject(LoadPictureService);

    const exportFiles = (): void => {
      if (this.dataStoreService.getDataStoreSize() > 0) {
        const dataStore = this.dataStoreService.getStore();
        const sheet = dataStore.map((data) => {
          const userPos = this.userPositionService.getUserByAddress(
            data[FIXED_DETAIL_COLUMNS[1]],
            data[FIXED_DETAIL_COLUMNS[0]],
            data[FIXED_DETAIL_COLUMNS[2]].toString()
          );
          if (userPos) {
            return {
              ...data,
              longitude: userPos.coords.longitude.toString(),
              latitude: userPos.coords.latitude.toString(),
              userPositionInfo: userPos.info,
            };
          } else {
            return data;
          }
        });
        this.excelService.generateExcel(sheet, EXPORTED_FILENAME + '.xls');
        this.jsonCreatorService.savaJsonFile(
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
