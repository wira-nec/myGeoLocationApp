import { Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UploadMultipleFilesComponent } from '../../upload-multiple-files/upload-multiple-files.component';
import { DataStoreService } from '../../../services/data-store.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-bottom-file-selection-sheet',
  imports: [UploadMultipleFilesComponent],
  templateUrl: './bottom-file-selection-sheet.component.html',
  styleUrl: './bottom-file-selection-sheet.component.scss',
})
export class BottomFileSelectionSheetComponent {
  excelData!: never[];
  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomFileSelectionSheetComponent>>(
      MatBottomSheetRef
    );

  constructor(private dataStore: DataStoreService) {}

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
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
        this.dataStore.store(this.excelData);
      }
    };
    reader.readAsArrayBuffer(file);
  }
}
