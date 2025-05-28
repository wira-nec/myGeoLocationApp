import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {
  CITY,
  HOUSE_NUMBER,
  POSTCODE,
  SHEET_NAME,
  StoreData,
  STREET,
} from './data-store.service';
import { mergeStoreData } from '../helpers/dataManipulations';

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
    // split data into ['geoPositionInfo', 'longitude', 'latitude', 'error'] and the rest
    // So their will be 2 sheets in the excel file, one with the original information and one with the location information
    const [sheetData, locationInfoData] = data.reduce(
      (acc, item) => {
        const { geoPositionInfo, longitude, latitude, error, ...rest } = item;
        acc[0].push(rest);
        // Add also postcode, city, house number and street to the second sheet for link to original sheet
        acc[1].push({
          postcode: rest[POSTCODE],
          city: rest[CITY],
          housenumber: rest[HOUSE_NUMBER],
          street: rest[STREET],
          geoPositionInfo,
          longitude,
          latitude,
          error,
        });
        return acc;
      },
      [[], []] as [StoreData[], StoreData[]]
    );
    // Group sheetData by sheetName and remove sheetName from the data
    const groupedSheet1Data: Record<string, StoreData[]> = {};
    sheetData.forEach((item) => {
      const nameOfSheet = item[SHEET_NAME] || 'Sheet1';
      if (!groupedSheet1Data[nameOfSheet]) {
        groupedSheet1Data[nameOfSheet] = [];
      }
      // Remove sheetName from the item
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sheetName, ...itemWithoutSheetName } = item;
      groupedSheet1Data[nameOfSheet].push(itemWithoutSheetName);
    });
    // Save each group as a separate sheet
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    Object.entries(groupedSheet1Data).forEach(([sheetName, sheetData]) => {
      const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    const locationInfoSheet: XLSX.WorkSheet =
      XLSX.utils.json_to_sheet(locationInfoData);
    XLSX.utils.book_append_sheet(workbook, locationInfoSheet, 'LocationInfo');
    XLSX.writeFile(workbook, fileName);
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
      // Get the headers from the newSheetData
      // and check if city, house number are present
      // and also postcode or street or both present
      const hasRequiredHeaders = newSheetData.some((item) => {
        const keys = Object.keys(item);
        return (
          keys.includes(CITY) &&
          keys.includes(HOUSE_NUMBER) &&
          (keys.includes(POSTCODE) || keys.includes(STREET))
        );
      });
      if (hasRequiredHeaders) {
        // Add the sheetName as key in excelData
        newSheetData.forEach((item) => {
          if (sheetName !== 'LocationInfo') {
            item[SHEET_NAME] = sheetName; // Add sheetName to each item
          }
        });
        excelData = mergeStoreData(newSheetData, excelData);
      } // Else skip sheet
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
    // ['geoPositionInfo', 'longitude', 'latitude', 'error']
    const hiddenHeaders = ['geoPositionInfo', 'longitude', 'latitude', 'error'];
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
