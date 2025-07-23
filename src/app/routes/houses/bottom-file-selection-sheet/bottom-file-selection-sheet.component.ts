import {
  Component,
  inject,
  OnInit,
  DestroyRef,
  AfterViewInit,
} from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UploadMultipleFilesComponent } from '../upload-multiple-files/upload-multiple-files.component';
import {
  dataContainsLocation,
  DataStoreService,
  GEO_INFO,
  getAddress,
  imagesFilter,
  LATITUDE,
  LONGITUDE,
  StoreData,
  UNIQUE_ID,
} from '../../../core/services/data-store.service';
import { ImportProgressBarComponent } from '../import-progress-bar/import-progress-bar.component';
import {
  PICTURES_IMPORT_PROGRESS_ID,
  ProgressService,
  XSL_IMPORT_PROGRESS_ID,
} from '../../../core/services/progress.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExcelService } from '../../../core/services/excel.service';
import { LoadPictureService } from '../../../core/services/load-picture.service';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter, takeWhile } from 'rxjs';
import {
  GeoCoderService,
  NIJKERK_COORDINATES,
} from '../../../core/services/geo-coder.service';
import { Markers } from '../providers/markers';
import { getAddress as getFullAddress } from '../../../core/helpers/dataManipulations';
import { ToasterService } from '../../../core/services/toaster.service';

@Component({
  selector: 'app-bottom-file-selection-sheet',
  imports: [
    UploadMultipleFilesComponent,
    ImportProgressBarComponent,
    CommonModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './bottom-file-selection-sheet.component.html',
  styleUrl: './bottom-file-selection-sheet.component.scss',
})
export class BottomFileSelectionSheetComponent
  implements OnInit, AfterViewInit
{
  progressId = XSL_IMPORT_PROGRESS_ID;
  excelData: StoreData[] = [];
  private isGeocodeHandlingFinished: boolean | undefined = undefined;
  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomFileSelectionSheetComponent>>(
      MatBottomSheetRef
    );

  private isDataStoreLoaded: boolean | undefined = undefined;
  private arePicturesLoaded: boolean | undefined = undefined;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly progressService: ProgressService,
    private readonly excelService: ExcelService,
    private readonly pictureService: LoadPictureService,
    private readonly geoCoderService: GeoCoderService,
    private readonly markers: Markers,
    private readonly toaster: ToasterService
  ) {}

  ngOnInit(): void {
    const progressSubscription = this.progressService
      .getProgress()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isDataStoreLoaded === undefined) {
          if (this.progressService.isProgressRunning(XSL_IMPORT_PROGRESS_ID)) {
            this.isDataStoreLoaded = false;
          }
        } else if (this.isDataStoreLoaded === false) {
          this.isDataStoreLoaded = !this.progressService.isProgressRunning(
            XSL_IMPORT_PROGRESS_ID
          );
        }
        if (this.arePicturesLoaded === undefined) {
          if (
            this.progressService.isProgressRunning(PICTURES_IMPORT_PROGRESS_ID)
          ) {
            this.arePicturesLoaded = false;
          }
        } else if (this.arePicturesLoaded === false) {
          this.arePicturesLoaded = !this.progressService.isProgressRunning(
            PICTURES_IMPORT_PROGRESS_ID
          );
        }
        if (this.isDataStoreLoaded && this.arePicturesLoaded) {
          this.closeLink();
          progressSubscription.unsubscribe();
        }
        if (
          this.progressService.currentProgress(XSL_IMPORT_PROGRESS_ID)?.count >
          1
        ) {
          this.progressService.setProgressMode(
            XSL_IMPORT_PROGRESS_ID,
            'determinate'
          );
        }
      });
    const pictureServiceSubscription = this.watchForPictureChanges();

    this.destroyRef.onDestroy(() => {
      progressSubscription.unsubscribe();
      pictureServiceSubscription.unsubscribe();
    });
  }

  ngAfterViewInit(): void {
    // Watch for progress to be finished
    const progressFinishedSubscription = this.progressService
      .getProgress()
      .pipe(
        takeWhile(
          (progress) =>
            !progress[XSL_IMPORT_PROGRESS_ID] ||
            progress[XSL_IMPORT_PROGRESS_ID].value !== 100,
          true
        ),
        filter(
          (progress) =>
            Object.keys(progress).length > 0 &&
            !!progress[XSL_IMPORT_PROGRESS_ID]
        )
      )
      .subscribe((progress) => {
        if (progress[XSL_IMPORT_PROGRESS_ID].value === 100) {
          this.dataStoreService.commit();
          this.geoCoderService.delayedZoomInOnCoordinates(NIJKERK_COORDINATES);
        }
      });
    this.destroyRef.onDestroy(() => {
      progressFinishedSubscription.unsubscribe();
    });
  }

  watchForPictureChanges() {
    return this.pictureService.pictureStore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pictures) => {
        if (Object.keys(pictures).length > 0) {
          this.dataStoreService.syncDataStoreWithPictures(
            pictures,
            this.dataStoreService.getStore()
          );
          this.dataStoreService.commit();
        }
      });
  }

  async setupMarkersAndUpdateDataWithLocationAndPictures(data: StoreData[]) {
    let longitude = 0;
    let latitude = 0;
    const errorMessage: string[] = [];
    const setupMarkers = (item: StoreData) => {
      longitude = Number(item[LONGITUDE]);
      latitude = Number(item[LATITUDE]);
      this.markers.setupMap(
        item[UNIQUE_ID],
        longitude,
        latitude,
        getFullAddress(item),
        item[GEO_INFO],
        this.geoCoderService.getView()
      );
    };
    const insertPictures = (item: StoreData) => {
      const pictureColumns = Object.keys(item).filter((columnName) =>
        imagesFilter(columnName)
      );
      pictureColumns.forEach((columnName) =>
        this.pictureService.storePicture(item[columnName], columnName)
      );
    };
    // Make requestLocation async function
    const requestLocation = async (item: StoreData) => {
      const [houseNumber, city, postcode] = getAddress(item);
      try {
        await this.geoCoderService.requestLocationAsync(item);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        errorMessage.push(`${postcode}, ${houseNumber}, ${city}`);
      }
    };

    for (const item of data) {
      if (dataContainsLocation(item)) {
        setupMarkers(item);
        insertPictures(item);
        await this.progressService.increaseProgressByStep(
          XSL_IMPORT_PROGRESS_ID
        );
      } else {
        await requestLocation(item);
      }
    }
    if (errorMessage.length) {
      this.toaster.show(
        'error',
        `${errorMessage.length} location request(s) failed for following address(es)`,
        errorMessage,
        600000
      );
    }
  }

  closeLink(): void {
    setTimeout(() => {
      this._bottomSheetRef.dismiss();
    }, 1000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFileChange(event: any) {
    const file = event.target.files[0];
    this.progressService.setProgressMode(
      XSL_IMPORT_PROGRESS_ID,
      'indeterminate'
    );
    this.progressService.setMaxCount(XSL_IMPORT_PROGRESS_ID, 1); // Reset progress bar
    this.excelService
      .importExcelFile(file, this.excelData, this.pictureService)
      .then(
        (excelData) => {
          this.excelData = excelData;
          this.dataStoreService.store(
            this.excelData,
            this.pictureService.getPicturesStore()
          );
          const dataStore = this.dataStoreService.getStore();
          this.progressService.setMaxCount(
            XSL_IMPORT_PROGRESS_ID,
            dataStore.length
          );
          this.geoCoderService.setProgressCallback(
            async () =>
              await this.progressService.increaseProgressByStep(
                XSL_IMPORT_PROGRESS_ID
              )
          );

          this.setupMarkersAndUpdateDataWithLocationAndPictures(dataStore);
        },
        (error) => console.log(error)
      );
  }
}
