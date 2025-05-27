import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {
  CITY,
  HOUSE_NUMBER,
  POSTCODE,
  StoreData,
  STREET,
} from './data-store.service';
import { mergeStoreData } from '../app/helpers/dataManipulations';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  /**
   * Generates an Excel file from the provided data.
   * The data is split into two sheets: one for general information and another for location details.
   * @param data - Array of StoreData objects containing the data to be exported.
   * @param fileName - The name of the file to be generated.
   */
  generateExcel(data: StoreData[], fileName: string): void {
    // split data into ['userPositionInfo', 'longitude', 'latitude', 'error'] and the rest
    // So their will be 2 sheets in the excel file, one with the original information and one with the location information
    const [sheet1Data, sheet2Data] = data.reduce(
      (acc, item) => {
        const { userPositionInfo, longitude, latitude, error, ...rest } = item;
        acc[0].push(rest);
        // Add also postcode, city, house number and street to the second sheet for link to original sheet
        acc[1].push({
          postcode: rest[POSTCODE],
          city: rest[CITY],
          housenumber: rest[HOUSE_NUMBER],
          street: rest[STREET],
          userPositionInfo,
          longitude,
          latitude,
          error,
        });
        return acc;
      },
      [[], []] as [StoreData[], StoreData[]]
    );
    const ws1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheet1Data);
    const ws2: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheet2Data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Sheet1');
    XLSX.utils.book_append_sheet(wb, ws2, 'LocationInfo');
    XLSX.writeFile(wb, fileName);
  }

  public importExcelFile(
    e: string | ArrayBuffer,
    excelData: StoreData[]
  ): StoreData[] {
    const workbook = XLSX.read(e, { type: 'binary' });
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const newSheetData = XLSX.utils.sheet_to_json(worksheet, {
        raw: true,
      }) as StoreData[];
      excelData = mergeStoreData(newSheetData, excelData);
    });
    return excelData;
  }

  /**
   * Hides specific columns in the provided worksheet based on the data.
   * The columns to hide are defined in the hiddenHeaders array.
   * @param data - Array of StoreData objects containing the data to be processed.
   * @param ws - The XLSX.WorkSheet object where columns will be hidden.
   */
  public hideColumns(data: StoreData[], ws: XLSX.WorkSheet) {
    // Get all unique values from the object in the data array
    const uniqueHeaders = Array.from(new Set(data.flatMap(Object.keys)));
    // create a boolean array from uniqueHeaders
    // where boolean is true if value is in
    // ['userPositionInfo', 'longitude', 'latitude', 'error']
    const hiddenHeaders = [
      'userPositionInfo',
      'longitude',
      'latitude',
      'error',
    ];
    const hiddenColumns = uniqueHeaders.map((header) =>
      hiddenHeaders.includes(header)
    );
    ws['!cols'] = [];
    // Hide all columns from hiddenHeaders array
    hiddenColumns.forEach((hidden, index) => {
      if (hidden && ws['!cols']) {
        ws['!cols'][index] = { hidden: true };
      }
    });
  }
}
