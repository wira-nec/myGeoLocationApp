import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UploadMultipleFilesComponent } from '../../upload-multiple-files/upload-multiple-files.component';
import {
  DataStoreService,
  StoreData,
} from '../../../services/data-store.service';
import { LoadPictureService } from '../../../services/load-picture.service';
import { ImportProgressBarComponent } from '../../import-progress-bar/import-progress-bar.component';
import { ProgressService } from '../../../services/progress.service';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ExcelService } from '../../../services/excel.service';

export const PROGRESS_ID = 'xsl-import-progress';

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
  progressId = PROGRESS_ID;
  excelData: StoreData[] = [];
  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomFileSelectionSheetComponent>>(
      MatBottomSheetRef
    );

  private isDataStoreLoaded = false;
  private isUserPositionLoaded = false;
  private importsNotFinished = true;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly loadPictureService: LoadPictureService,
    private readonly dataStoreService: DataStoreService,
    private readonly progressService: ProgressService,
    private readonly excelService: ExcelService
  ) {
    this.importsNotFinished =
      Object.keys(loadPictureService.pictureStore$.value).length === 0 ||
      dataStoreService.getIncreasedDataStoreSize() === 0;
    // progressService.setProgress(this.PROGRESS_ID, 0);
  }

  ngOnInit(): void {
    const loadPictureServiceSubscription = this.loadPictureService.pictureStore$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((pic) => !!Object.keys(pic).length)
      )
      .subscribe({
        next: (pictures) => {
          this.isUserPositionLoaded = !!Object.keys(pictures).length;
          if (this.isDataStoreLoaded && this.importsNotFinished) {
            this.closeLink();
          }
        },
      });
    const dataStoreServiceSubscription = this.dataStoreService.dataStore$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((data) => !!data.length)
      )
      .subscribe({
        next: () => {
          this.isDataStoreLoaded =
            !!this.dataStoreService.getIncreasedDataStoreSize();
          if (this.isUserPositionLoaded && this.importsNotFinished) {
            this.closeLink();
          }
        },
      });

    this.destroyRef.onDestroy(() => {
      loadPictureServiceSubscription.unsubscribe();
      dataStoreServiceSubscription.unsubscribe();
    });
  }

  closeLink(): void {
    this._bottomSheetRef.dismiss();
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
        this.progressService.setMaxCount(PROGRESS_ID, 1); // Reset progress bar
        this.dataStoreService.store(this.excelData);
      }
    };

    reader.readAsArrayBuffer(file);
  }
}
