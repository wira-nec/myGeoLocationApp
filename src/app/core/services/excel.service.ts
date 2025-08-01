import { Injectable } from '@angular/core';
import {
  ADDRESS_KEYS,
  getAllHeaderInfo,
  getDataStoreKeys,
  getImageName,
  getImageNames,
  SHEET_NAME,
  StoreData,
  UNIQUE_ID,
} from './data-store.service';
import { mergeStoreData } from '../helpers/dataManipulations';
import { ToasterService } from './toaster.service';
import * as Excel from 'exceljs';
import * as FileSaver from 'file-saver';
import { LoadPictureService } from './load-picture.service';

interface IWorkbookMediaImageInfo {
  imageId: number;
  width: number;
  height: number;
}

interface IWorkSheet {
  name: string;
  autoFilter?: Excel.AutoFilter;
  headerFooter: Partial<Excel.HeaderFooter>;
  pageSetup: Partial<Excel.PageSetup>;
  properties: Excel.WorksheetProperties;
  state: Excel.WorksheetState;
  tables: Excel.Table[];
  views: Partial<Excel.WorksheetView>[];
  header: Excel.Row;
}

interface ExtendedImageRange extends Excel.ImageRange {
  ext: { width: number; height: number };
}

const LOCATION_SHEET_NAME = 'LocationInfo';

const DEFAULT_ROW_HEIGHT = 50;
@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  private workbook_creator = 'MyGeoLocation';
  private workbook_lastModifiedBy = 'MyGeoLocation';
  private workbook_created = new Date();
  private workbook_modified = new Date();
  private workbook_lastPrinted = new Date();
  private workbook_views: Excel.WorkbookView[] = [];
  private workbook_properties_date1904 = true;
  private sheet_properties: IWorkSheet[] = [];

  constructor(private readonly toaster: ToasterService) {}

  /**
   * Generates an Excel file from the provided data.
   * The data is split into two sheets: one for general information and another for location details.
   * @param data - Array of StoreData objects containing the data to be exported.
   * @param fileName - The name of the file to be generated.
   */
  async generateExcel(
    data: StoreData[],
    fileName: string,
    pictureService: LoadPictureService
  ): Promise<void> {
    const [sheetData, locationInfoData] = this.splitStoreDataToSheetData(data);

    const groupedSheetData: Record<string, StoreData[]> =
      this.groupDataPerSheet(sheetData);

    // Save each group as a separate sheet
    const workbook = await this.createWorkBook(
      groupedSheetData,
      pictureService
    );

    this.setWorkbookProperties(workbook);

    // Add locationInfo sheet
    await this.addSheetToWorkbook(
      workbook,
      LOCATION_SHEET_NAME,
      locationInfoData,
      []
    );

    // Save workbook
    await this.writeWorkBook(workbook, fileName);
  }

  public async importExcelFile(
    file: File,
    excelData: StoreData[],
    pictureService: LoadPictureService
  ): Promise<StoreData[]> {
    const workbook = new Excel.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const allImagesInWorkBook = this.readAllImagesFromWorkbook(workbook);
    this.getWorkbookProperties(workbook);

    workbook.eachSheet((worksheet) => {
      if (!worksheet.getRow(1).cellCount) return;

      const { storeData, imageHeaderCols } = this.readDataFromWorkSheet(
        worksheet,
        allImagesInWorkBook,
        pictureService
      );

      // Get the headers from the newSheetData
      const hasRequiredHeaders = this.validateHeaders(storeData);
      if (hasRequiredHeaders) {
        // Add the sheetName as key in excelData and add image column if required
        storeData.forEach((item) => {
          if (worksheet.name !== 'LocationInfo') {
            item[SHEET_NAME] = worksheet.name; // Add sheetName to each item
          }
          // Check if image column is missing and if so add column with address as picture name or empty string
          let addedHeader = false;
          imageHeaderCols.forEach((imageHeader) => {
            if (!Object.keys(item).includes(imageHeader) && !addedHeader) {
              item[imageHeader] = getImageName(item) || '';
              // Only only image column shall have address image name, for now we only support 1 image column
              if (item[imageHeader].length) {
                addedHeader = true;
              }
            }
          });
        });
        excelData = mergeStoreData(storeData, excelData);
      } // Else skip sheet
    });
    return excelData;
  }

  private convertImageToBase64(image: Excel.Media) {
    // image.buffer is a Uint8Array or ArrayBuffer
    const uint8Array = new Uint8Array(image.buffer);
    let binary = '';
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64String = btoa(binary);
    // You may want to prepend the correct MIME type:
    const mimeType = 'image/jpeg';
    const imageData = `data:${mimeType};base64,${base64String}`;
    return imageData;
  }

  private ConvertBase64ToBufferImage(image: string) {
    const sliceSize = 512;
    const b64Data = image.replace(
      // eslint-disable-next-line no-useless-escape
      /data\:image\/(jpeg|jpg|png)\;base64\,/gi,
      ''
    );
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const totalLength = byteArrays.reduce(
      (acc, value) => acc + value.length,
      0
    );
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of byteArrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  private readAllImagesFromWorkbook(workbook: Excel.Workbook) {
    const images: string[] = [];
    workbook.model.media.forEach((image) => {
      if (image.buffer) {
        images.push(this.convertImageToBase64(image));
      }
    });
    return images;
  }

  private readDataFromWorkSheet(
    worksheet: Excel.Worksheet,
    allImagesInWorkBook: string[],
    pictureService: LoadPictureService
  ) {
    const storeData: StoreData[] = [];
    const imageHeaderCols: string[] = [];
    const header = worksheet.getRow(1);
    const headers: string[] = [];
    header.eachCell((cell) => {
      headers.push(cell.text);
    });
    const addressIndex = headers.findIndex((key) => ADDRESS_KEYS.includes(key));

    const sheetImages = worksheet.getImages().map((image) => ({
      imageId: image.imageId,
      nativeRow: image.range.tl.nativeRow,
      nativeCol: image.range.tl.nativeCol,
      ext: (image.range as ExtendedImageRange).ext,
    }));

    if (!sheetImages.length) {
      // if there are no images in the sheet then images are only included in the workbook
      // In that case we need to reverse the order of the workbook images
      allImagesInWorkBook.reverse();
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber == 1) return;
      const obj = { [UNIQUE_ID]: rowNumber.toString() } as StoreData;
      let headersIndex = 0;
      row.eachCell((cell, colNumber) => {
        // empty cell are exclude in loop eachCell, so we need to add empty string to obj for the missing column cell
        while (colNumber - 1 > headersIndex) {
          obj[headers[headersIndex++]] = '';
        }
        const cellText = cell.text;
        let imageData = undefined;
        let filename = 'image corrupted?';
        if (
          cellText.toUpperCase() === '#VALUE!' ||
          (cell.model.type === Excel.ValueType.RichText &&
            typeof cell.value === 'object' &&
            cell.value !== null &&
            'richText' in cell.value &&
            Array.isArray((cell.value as Excel.CellRichTextValue).richText) &&
            (cell.value as Excel.CellRichTextValue).richText.find(
              (t) => t.font?.color?.argb === 'FFFFFFFF'
            ))
        ) {
          // Cell found with image object
          if (sheetImages.length) {
            // the worksheet has images
            // search in workBook images for the imageId based on row/col number found in workSheet images
            const rowImage = sheetImages.find(
              (image) =>
                image.nativeRow === rowNumber - 1 &&
                image.nativeCol === colNumber - 1
            );
            if (rowImage && addressIndex >= 0) {
              // get the image data from workBook images based on row/col number found in workSheet images
              imageData = allImagesInWorkBook[Number(rowImage.imageId)];
            } else if (addressIndex >= 0) {
              // no image found in the workSheet images, so search in workBook images for image based on image id found in workSheet images
              const imageId = allImagesInWorkBook.findIndex(
                (_image, index) =>
                  !sheetImages.some((img) => img.imageId === index.toString())
              );
              if (imageId >= 0) {
                // get the image for imageId from allImagesInWorkBook and remove it from the array
                imageData = allImagesInWorkBook[imageId];
                // remove the image from allImagesInWorkBook because we have used it
                // and we don't want to use it again
                allImagesInWorkBook.splice(imageId, 1);
                // lower all imageId's greater than imageId in sheetImages by 1
                // to keep the imageId's in sync with the images in the workbook
                sheetImages.forEach((image) => {
                  if (Number(image.imageId) > imageId) {
                    image.imageId = (Number(image.imageId) - 1).toString();
                  }
                });
              } // Else no image found, so handle it as normal data (= imageId is undefined)
            }
          } else {
            // workSheet does not have images so get one from WorkBook images
            imageData = allImagesInWorkBook.pop();
          }
        }
        if (imageData) {
          // Found image column, create filename for image and store it
          filename = row.getCell(addressIndex + 1) + '.jpg';
          pictureService.storePicture(imageData, filename);
          if (!imageHeaderCols.includes(headers[headersIndex])) {
            imageHeaderCols.push(headers[headersIndex]);
          }
          obj[headers[headersIndex++]] = filename;
        } else {
          obj[headers[headersIndex++]] = cellText;
        }
      });
      storeData.push(obj);
    });
    return { storeData, imageHeaderCols };
  }

  private validateHeaders(sheetData: StoreData[]) {
    return sheetData.some((item) => {
      const itemKeys = getDataStoreKeys(item);
      return (
        // Or address is present or at least 3 of the other keys are present
        (itemKeys.length === 1 && itemKeys[0]) || itemKeys.length >= 3
      );
    });
  }

  /**
   * Creates a workbook, created sheets and load data into each sheet
   * @param groupedSheetData
   * @returns workbook
   */
  private async createWorkBook(
    groupedSheetData: Record<string, StoreData[]>,
    pictureService: LoadPictureService
  ) {
    const workbook = new Excel.Workbook();
    const storedImages = await this.addImagesToWorkbook(
      workbook,
      pictureService
    );
    for (const sheetName in groupedSheetData) {
      await this.addSheetToWorkbook(
        workbook,
        sheetName,
        groupedSheetData[sheetName],
        storedImages
      );
    }
    return workbook;
  }

  private async addSheetToWorkbook(
    workbook: Excel.Workbook,
    sheetName: string,
    sheetData: StoreData[],
    images: Record<string, IWorkbookMediaImageInfo>[]
  ) {
    const sheet = workbook.addWorksheet(sheetName);
    const headers = getAllHeaderInfo(sheetData).map((key) => key[0]);
    sheet.addRow(headers);
    sheet.columns = headers.map((header) => ({
      header: header,
      key: header,
    }));
    const rows = Object.values(sheetData).map((row) => {
      const excelRow: Record<string, string | number> = {
        ...row,
      };
      Object.keys(excelRow).forEach((key) => {
        const cellValueIsNumber = !isNaN(Number(row[key]));
        if (cellValueIsNumber && row[key].length) {
          excelRow[key] = Number(row[key]);
        }
      });
      return excelRow;
    });
    sheet.addRows(rows);
    this.addImagesToSheet(sheet, sheetData, images);
  }

  private async writeWorkBook(workbook: Excel.Workbook, filename: string) {
    await workbook.xlsx
      .writeBuffer()
      .then((buffer) => FileSaver.saveAs(new Blob([buffer]), filename))
      .catch((err) =>
        this.toaster.show(
          'error',
          `Failed to export excel document due to: ${err.message}`
        )
      );
  }

  /**
   * Split data into ['geoPositionInfo', 'longitude', 'latitude', 'error'] and the rest
   * So their will be 2 sheets in the excel file, one with the original information and one with the location information
   * @param data
   * @returns
   */
  private splitStoreDataToSheetData(
    data: StoreData[]
  ): [StoreData[], StoreData[]] {
    return data.reduce(
      (acc, item) => {
        const pictureNames = getImageNames(item);
        // Destructure geoPositionInfo, longitude, latitude, error, and all pictureNames from item
        const { id, geoPositionInfo, longitude, latitude, error, ...restAll } =
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
          id,
          ...(rest[postcode] ? { [postcode]: rest[postcode] } : {}),
          ...(rest[city] ? { [city]: rest[city] } : {}),
          ...(rest[houseNumber] ? { [houseNumber]: rest[houseNumber] } : {}),
          ...(rest[street] ? { [street]: rest[street] } : {}),
          ...(rest[address] ? { [address]: rest[address] } : {}),
          geoPositionInfo,
          longitude,
          latitude,
          error,
          //...pictureFields,
        });
        return acc;
      },
      [[], []] as [StoreData[], StoreData[]]
    );
  }

  /**
   * Group sheetData by sheetName and remove sheetName from the data
   * @param sheetData
   * @returns grouped data sheets
   */
  private groupDataPerSheet(sheetData: StoreData[]) {
    const groupedSheetData: Record<string, StoreData[]> = {};
    sheetData.forEach((item) => {
      const nameOfSheet = item[SHEET_NAME] || 'Sheet1';
      if (!groupedSheetData[nameOfSheet]) {
        groupedSheetData[nameOfSheet] = [];
      }
      // Remove sheetName from the item
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sheetName, ...itemWithoutSheetName } = item;
      groupedSheetData[nameOfSheet].push(itemWithoutSheetName);
    });
    return groupedSheetData;
  }

  private async addImagesToWorkbook(
    workbook: Excel.Workbook,
    pictureService: LoadPictureService
  ) {
    const imageIds: Record<string, IWorkbookMediaImageInfo>[] = [];
    const images = pictureService.getPicturesStore();
    for (const key in images) {
      const img = new Image();
      img.src = images[key] as string;
      await img.decode();
      // add image to workbook by base64
      imageIds.push({
        [key]: {
          imageId: workbook.addImage({
            base64: images[key] as string,
            extension: 'jpeg',
          }),
          width: img.width,
          height: img.height,
        },
      });
    }
    return imageIds;
  }

  private addImagesToSheet(
    worksheet: Excel.Worksheet,
    storeData: StoreData[],
    imageIds: Record<string, IWorkbookMediaImageInfo>[]
  ) {
    if (worksheet.rowCount !== storeData.length + 1) {
      // +1 for header row
      return;
    }

    storeData.forEach((data, rowNumber) => {
      const imageName = getImageName(data);
      // Function to hide the image name in the cell
      const hideCellText = (colNum: number) => {
        const pictureCell = worksheet.getCell(rowNumber + 2, colNum + 1);
        pictureCell.value = {
          richText: [
            {
              text: imageName ?? '',
              font: { size: 1, color: { argb: 'FFFFFFFF' } },
            },
          ],
        };
        pictureCell.style = {
          ...pictureCell.style,
          numFmt: ';;;',
        };
      };

      if (imageName) {
        const imgColIndex = Object.keys(data).findIndex(
          (key) => data[key]?.toLowerCase() === imageName
        );
        const imageId = imageIds.find(
          (image) => Object.keys(image)[0] === imageName
        );
        if (imageId && imgColIndex >= 0) {
          const imageInfo = Object.values(imageId)[0];
          hideCellText(imgColIndex);
          worksheet.addImage(imageInfo.imageId, {
            tl: { col: imgColIndex, row: rowNumber + 1 },
            ext: {
              width: DEFAULT_ROW_HEIGHT * (imageInfo.width / imageInfo.height),
              height: DEFAULT_ROW_HEIGHT,
            },
            editAs: undefined,
          });
          worksheet.getColumn(imgColIndex + 1).width =
            DEFAULT_ROW_HEIGHT * (imageInfo.width / imageInfo.height);
          worksheet.getRow(rowNumber + 2).height = DEFAULT_ROW_HEIGHT;
        } else if (imgColIndex >= 0) {
          hideCellText(imgColIndex);
        }
      }
    });
  }

  private getWorkbookProperties(workbook: Excel.Workbook) {
    this.workbook_creator = workbook.creator;
    this.workbook_lastModifiedBy = workbook.lastModifiedBy;
    this.workbook_created = workbook.created;
    this.workbook_modified = workbook.modified;
    this.workbook_lastPrinted = workbook.lastPrinted;
    this.workbook_views = workbook.views;
    this.workbook_properties_date1904 = workbook.properties.date1904;
    this.sheet_properties = [];
    workbook.eachSheet((sheet) => {
      if (sheet.name !== LOCATION_SHEET_NAME) {
        this.sheet_properties.push({
          name: sheet.name,
          autoFilter: sheet.autoFilter,
          headerFooter: sheet.headerFooter,
          pageSetup: sheet.pageSetup,
          properties: sheet.properties,
          state: sheet.state,
          tables: sheet.getTables().map((tab) => tab[0]),
          views: sheet.views,
          header: sheet.getRow(1),
        });
      }
    });
  }

  private setWorkbookProperties(workbook: Excel.Workbook) {
    workbook.creator = this.workbook_creator;
    workbook.lastModifiedBy = this.workbook_lastModifiedBy;
    workbook.created = this.workbook_created;
    workbook.modified = new Date();
    workbook.lastPrinted = this.workbook_lastPrinted;
    workbook.properties.date1904 = this.workbook_properties_date1904;
    workbook.views = [
      {
        ...this.workbook_views[0],
        firstSheet: 0,
        activeTab: 0,
        visibility: 'visible',
      },
    ];
    this.sheet_properties.forEach((sheet, index) => {
      if (sheet.name !== LOCATION_SHEET_NAME) {
        const workbookSheet = workbook.worksheets[index];
        if (sheet.autoFilter) {
          workbookSheet.autoFilter = sheet.autoFilter;
        }
        workbookSheet.headerFooter = sheet.headerFooter;
        workbookSheet.pageSetup = sheet.pageSetup;
        workbookSheet.properties = sheet.properties;
        workbookSheet.state = sheet.state;
        sheet.tables.forEach((table) => workbookSheet.addTable(table));
        workbookSheet.views = sheet.views;
        // Overwrite header to get correctly formatted headers
        const headerRow = workbookSheet.getRow(1);
        if (headerRow) {
          headerRow.eachCell((cell, index) => {
            if (index <= sheet.header.cellCount) {
              cell.value = sheet.header.getCell(index).value ?? cell.value;
              cell.style = sheet.header.getCell(index).style;
              cell.font = sheet.header.getCell(index).font;
            }
          });
        }
      }
    });
  }
}
