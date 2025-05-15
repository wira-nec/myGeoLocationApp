import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UploadMultipleFilesComponent } from '../../upload-multiple-files/upload-multiple-files.component';
import { DataStoreService } from '../../../services/data-store.service';
import * as XLSX from 'xlsx';
import { LoadPictureService } from '../../../services/load-picture.service';
import { ImportProgressBarComponent } from '../../import-progress-bar/import-progress-bar.component';
import { ProgressService } from '../../../services/progress.service';
import { CommonModule } from '@angular/common';
import { UserPositionService } from '../../../services/user-position.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

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
  readonly PROGRESS_ID = 'xsl-import-progress';
  excelData!: never[];
  private maxProgressCount = 0;
  private currentProgressCount = 0;
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
    private readonly userPositionService: UserPositionService,
    private readonly progressService: ProgressService
  ) {
    this.importsNotFinished =
      Object.keys(loadPictureService.pictureStore$.value).length === 0 ||
      dataStoreService.getDataStoreSize() === 0;
    progressService.setProgress(this.PROGRESS_ID, 0);
  }

  ngOnInit(): void {
    const loadPictureServiceSubscription = this.loadPictureService.pictureStore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(filter((pic) => !!Object.keys(pic).length))
      .subscribe({
        next: (pictures) => {
          this.isUserPositionLoaded = !!Object.keys(pictures).length;
          if (this.isDataStoreLoaded && this.importsNotFinished) {
            this.closeLink();
          }
        },
      });
    const dataStoreServiceSubscription = this.dataStoreService.dataStore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(filter((data) => !!data.length))
      .subscribe({
        next: (data) => {
          this.maxProgressCount = data.length;
          this.currentProgressCount = 1;
          this.isDataStoreLoaded = !!data.length;
          if (this.isUserPositionLoaded && this.importsNotFinished) {
            this.closeLink();
          }
        },
      });
    const userPositionServiceSubscription =
      this.userPositionService.userPositions$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .pipe(filter((pos) => !!pos.length))
        .subscribe(() => {
          this.progressService.setProgress(
            this.PROGRESS_ID,
            (100 / this.maxProgressCount) * this.currentProgressCount++
          );
        });

    this.destroyRef.onDestroy(() => {
      loadPictureServiceSubscription.unsubscribe();
      dataStoreServiceSubscription.unsubscribe();
      userPositionServiceSubscription.unsubscribe();
    });
  }

  closeLink(): void {
    this._bottomSheetRef.dismiss();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFileChange(event: any) {
    this.progressService.setProgress(this.PROGRESS_ID, 0);
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        this.excelData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
        this.dataStoreService.store(this.excelData);
      }
    };

    reader.readAsArrayBuffer(file);
  }
}
