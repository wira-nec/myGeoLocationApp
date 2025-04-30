import { Component } from '@angular/core';
import { HousesMapComponent } from '../houses-map/houses-map.component';
import { UploadMultipleFilesComponent } from '../upload-multiple-files/upload-multiple-files.component';
import * as XLSX from 'xlsx';
import { DataStoreService } from '../../services/data-store.service';

@Component({
  selector: 'app-houses',
  standalone: true,
  imports: [HousesMapComponent, UploadMultipleFilesComponent],
  templateUrl: './houses.component.html',
  styleUrl: './houses.component.scss',
})
export class HousesComponent {
  excelData!: never[];

  constructor(private dataStore: DataStoreService) {}

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
