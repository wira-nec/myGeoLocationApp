import { Component, inject, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UploadMultipleFilesComponent } from '../../upload-multiple-files/upload-multiple-files.component';
import { DataStoreService } from '../../../services/data-store.service';
import * as XLSX from 'xlsx';
import { LoadPictureService } from '../../../services/load-picture.service';

@Component({
  selector: 'app-bottom-file-selection-sheet',
  imports: [UploadMultipleFilesComponent],
  templateUrl: './bottom-file-selection-sheet.component.html',
  styleUrl: './bottom-file-selection-sheet.component.scss',
})
export class BottomFileSelectionSheetComponent implements OnInit {
  excelData!: never[];
  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomFileSelectionSheetComponent>>(
      MatBottomSheetRef
    );

  constructor(
    private readonly loadPictureService: LoadPictureService,
    private readonly dataStoreService: DataStoreService
  ) {}

  ngOnInit(): void {
    this.loadPictureService.pictureStore$.subscribe({
      next: (pictures) => {
        this.isUserPositionLoaded = !!Object.keys(pictures).length;
        if (this.isDataStoreLoaded) {
          this.closeLink();
        }
      },
    });
    this.dataStoreService.dataStore$.subscribe({
      next: (data) => {
        this.isDataStoreLoaded = !!data.length;
        if (this.isUserPositionLoaded) {
          this.closeLink();
        }
      },
    });
  }

  private isDataStoreLoaded = false;
  private isUserPositionLoaded = false;

  closeLink(): void {
    this._bottomSheetRef.dismiss();
    if (this.isDataStoreLoaded && this.isUserPositionLoaded) {
      this.loadPictureService.pictureStore$.unsubscribe();
      this.dataStoreService.dataStore$.unsubscribe();
    }
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
