import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UploadMultipleFilesComponent } from '../upload-multiple-files/upload-multiple-files.component';
import {
  DataStoreService,
  StoreData,
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

@Component({
  selector: 'app-bottom-file-selection-sheet',
  imports: [
    UploadMultipleFilesComponent,
    ImportProgressBarComponent,
    CommonModule,
  ],
  templateUrl: './bottom-file-selection-sheet.component.html',
  styleUrl: './bottom-file-selection-sheet.component.scss',
})
export class BottomFileSelectionSheetComponent implements OnInit {
  progressId = XSL_IMPORT_PROGRESS_ID;
  excelData: StoreData[] = [];
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
    private readonly pictureService: LoadPictureService
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
      });
    const pictureServiceSubscription = this.watchForPictureChanges();

    this.destroyRef.onDestroy(() => {
      progressSubscription.unsubscribe();
      pictureServiceSubscription.unsubscribe();
    });
  }

  watchForPictureChanges() {
    return this.pictureService.pictureStore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((pictures) => {
        if (Object.keys(pictures).length > 0) {
          this.dataStoreService.syncDataStoreWithPictures(pictures, true);
          // this.progressService.setMaxCount(PICTURES_IMPORT_PROGRESS_ID, 1); // Reset progress bar
        }
      });
  }
  closeLink(): void {
    setTimeout(() => {
      this._bottomSheetRef.dismiss();
    }, 1000);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFileChange(event: any) {
    const file = event.target.files[0];
    this.excelService
      .importExcelFile(file, this.excelData, this.pictureService)
      .then(
        (excelData) => {
          this.excelData = excelData;
          this.progressService.setMaxCount(XSL_IMPORT_PROGRESS_ID, 1); // Reset progress bar
          this.dataStoreService.store(
            this.excelData,
            this.pictureService.getPicturesStore()
          );
        },
        (error) => console.log(error)
      );
  }
}
