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
    private readonly excelService: ExcelService
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

    this.destroyRef.onDestroy(() => {
      progressSubscription.unsubscribe();
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
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.excelData = this.excelService.importExcelFile(
          e.target.result,
          this.excelData
        );
        this.progressService.setMaxCount(XSL_IMPORT_PROGRESS_ID, 1); // Reset progress bar
        this.dataStoreService.store(this.excelData);
      }
    };

    reader.readAsArrayBuffer(file);
  }
}
