import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { StoreData } from './data-store.service';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  generateExcel(data: StoreData[], fileName: string): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, fileName);
  }
}
