import { Component, inject, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UploadMultipleFilesComponent } from '../../upload-multiple-files/upload-multiple-files.component';
import { DataStoreService } from '../../../services/data-store.service';
import * as XLSX from 'xlsx';
import { LoadPictureService } from '../../../services/load-picture.service';
import { ImportProgressBarComponent } from '../../import-progress-bar/import-progress-bar.component';
import { ProgressService } from '../../../services/progress.service';
import { CommonModule } from '@angular/common';
import { UserPositionService } from '../../../services/user-position.service';

@Component({
  selector: 'app-bottom-file-selection-sheet',
  imports: [
    UploadMultipleFilesComponent,
    ImportProgressBarComponent,
    CommonModule,
  ],
  templateUrl: './bottom-file-selection-sheet.component.html',
  styleUrl: './bottom-file-selection-sheet.component.scss',
  providers: [ProgressService],
})
export class BottomFileSelectionSheetComponent implements OnInit {
  excelData!: never[];
  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomFileSelectionSheetComponent>>(
      MatBottomSheetRef
    );

  private isDataStoreLoaded = false;
  private isUserPositionLoaded = false;
  private importsNotFinished = true;

  constructor(
    private readonly loadPictureService: LoadPictureService,
    private readonly dataStoreService: DataStoreService,
    private readonly userPositionService: UserPositionService,
    readonly progressService: ProgressService
  ) {
    this.importsNotFinished =
      Object.keys(loadPictureService.pictureStore$.value).length === 0 ||
      dataStoreService.getDataStoreSize() === 0;
  }

  ngOnInit(): void {
    this.loadPictureService.pictureStore$.subscribe({
      next: (pictures) => {
        this.isUserPositionLoaded = !!Object.keys(pictures).length;
        if (this.isDataStoreLoaded && this.importsNotFinished) {
          this.closeLink();
        }
      },
    });
    this.dataStoreService.dataStore$.subscribe({
      next: (data) => {
        this.isDataStoreLoaded = !!data.length;
        if (data.length) {
          this.progressService.reset(data.length);
        }
        if (this.isUserPositionLoaded && this.importsNotFinished) {
          this.closeLink();
        }
      },
    });
    this.userPositionService.userPositions$.subscribe((userPositions) => {
      this.progressService.incrementProgress(userPositions.length);
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
