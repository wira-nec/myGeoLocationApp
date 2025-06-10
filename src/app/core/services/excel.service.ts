import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {
  getDataStoreKeys,
  getImageNames,
  SHEET_NAME,
  StoreData,
} from './data-store.service';
import { mergeStoreData } from '../helpers/dataManipulations';
import { ToasterService } from './toaster.service';

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor(private readonly toaster: ToasterService) {}

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
        const pictureNames = getImageNames(item);
        // Destructure geoPositionInfo, longitude, latitude, error, and all pictureNames from item
        const { geoPositionInfo, longitude, latitude, error, ...restAll } =
          item;
        // Extract picture fields and remove them from restAll
        const pictureFields: Record<string, string> = {};
        pictureNames.forEach((name) => {
          if (name in restAll) {
            pictureFields[name] = restAll[name];
            delete restAll[name];
          }
        });
        const rest = restAll;
        acc[0].push(rest);
        // Add also postcode, city, house number and street to the second sheet for link to original sheet
        const [address, street, postcode, houseNumber, city] =
          getDataStoreKeys(rest);
        acc[1].push({
          ...(rest[postcode] ? { [postcode]: rest[postcode] } : {}),
          ...(rest[city] ? { [city]: rest[city] } : {}),
          ...(rest[houseNumber] ? { [houseNumber]: rest[houseNumber] } : {}),
          ...(rest[street] ? { [street]: rest[street] } : {}),
          ...(rest[address] ? { [address]: rest[address] } : {}),
          geoPositionInfo,
          longitude,
          latitude,
          error,
          ...pictureFields,
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
    try {
      XLSX.writeFile(workbook, fileName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.toaster.show(
        'error',
        `Failed to export excel document due to: ${e.message}`
      );
    }
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
      const hasRequiredHeaders = newSheetData.some((item) => {
        const itemKeys = getDataStoreKeys(item);
        return (
          // Or address is present or at least 3 of the other keys are present
          (itemKeys.length === 1 && itemKeys[0]) || itemKeys.length >= 3
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
