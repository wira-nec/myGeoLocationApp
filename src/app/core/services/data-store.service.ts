import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { blobsFilter, mergeStoreData } from '../helpers/dataManipulations';
import { isEqual } from 'lodash';
import { PictureStore } from './load-picture.service';
import { makeAddressComparable } from '../helpers/string-manipulations';

export type StoreData = Record<string, string>;

export const UNIQUE_ID = 'id';
export const ADDRESS = 'address';
export const POSTCODE = 'postcode';
export const CITY = 'city';
export const HOUSE_NUMBER = 'housenumber';
export const VOORAANZICHT = 'Vooraanzicht';
export const GEO_INFO = 'geoPositionInfo';
export const ERROR = 'error';
export const STREET = 'street';
export const LONGITUDE = 'longitude';
export const LATITUDE = 'latitude';
export const FIRST_NAME = 'firstName';
export const SHEET_NAME = 'sheetName';
export const COORDINATE_KEYS: string[] = [LONGITUDE, LATITUDE];

export const ADDRESS_KEYS: string[] = ['adres', 'Adres', 'address', 'Address'];
const POSTCODE_KEYS: string[] = [
  'postcode',
  'Postcode',
  'zipCode',
  'ZipCode',
  'zip code',
  'Zip code',
];
const CITY_KEYS: string[] = [
  'city',
  'City',
  'plaats',
  'Plaats',
  'woonplaats',
  'Woonplaats',
];
const STREET_KEYS: string[] = ['street', 'Street', 'straat', 'Straat'];
const HOUSE_NUMBER_KEYS: string[] = [
  'housenumber',
  'Housenumber',
  'houseNummer',
  'HouseNumber',
  'house number',
  'House number',
  'Huis Nummer',
  'huis nummer',
  'Huis nummer',
  'huis nr',
  'Huis nr',
  'huisnr',
  'Huisnr',
];

const HOUSE_NUMBER_REGEX = /(\s\d+[\s,-]?\d*[A-Za-z]?[,]?)+\s/;
const IMAGE_EXTENSION_REGEX = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;

function getKey(
  item: StoreData,
  possibleKeys: string[],
  defaultKey: string
): string {
  return (
    Object.keys(item).find((key) => possibleKeys.includes(key)) || defaultKey
  );
}

export const imagesFilter = (value: string): boolean => {
  return IMAGE_EXTENSION_REGEX.test(value);
};

/**
 * Retrieves an array of data store keys for the provided `StoreData` item.
 *
 * @param item - The data item from which to extract keys.
 * @returns An array containing the following keys, in order:
 * - `ADDRESS`
 * - `STREET`
 * - `POSTCODE`
 * - `HOUSE_NUMBER`
 * - `CITY`
 */
export const getDataStoreKeys = (item: StoreData) => [
  getKey(item, ADDRESS_KEYS, ''),
  getKey(item, STREET_KEYS, STREET),
  getKey(item, POSTCODE_KEYS, POSTCODE),
  getKey(item, HOUSE_NUMBER_KEYS, HOUSE_NUMBER),
  getKey(item, CITY_KEYS, CITY),
];

export const getAddress = (data: StoreData) => {
  const [addressKey, streetKey, postcodeKey, houseNumberKey, cityKey] =
    getDataStoreKeys(data);
  if (addressKey) {
    const [street, houseNumber, city] =
      data[addressKey].split(HOUSE_NUMBER_REGEX);
    if (postcodeKey) {
      return [
        street.trim(),
        houseNumber.trim(),
        city.trim(),
        data[postcodeKey].replaceAll(' ', ''),
      ];
    } else {
      return [street.trim(), houseNumber.trim(), city.trim(), ''];
    }
  } else {
    return [
      data[streetKey] || ''.trim(),
      data[houseNumberKey].toString().trim(),
      data[cityKey].trim(),
      data[postcodeKey].replaceAll(' ', ''),
    ];
  }
};

export const getImageName = (details: StoreData) => {
  const addressKey = getKey(details, ADDRESS_KEYS, '');
  if (details[addressKey]) {
    const [street, houseNumber, city] =
      details[addressKey].split(HOUSE_NUMBER_REGEX);
    return `${street.trim()} ${houseNumber.trim()} ${city.trim()}.jpg`.toLowerCase();
  }
  return undefined;
};

export const getImageNames = (details: StoreData) => {
  const imageName = getImageName(details);
  if (imageName) {
    return [imageName];
  }
  return Object.values(details).filter((value) => imagesFilter(value));
};

export const getBlobs = (details: StoreData) => {
  return Object.values(details).filter((value) => blobsFilter(value));
};

export function hasPictures(details: StoreData) {
  if (details) {
    if (getBlobs(details).length > 0 || getImageNames(details).length > 0) {
      return true;
    }
  }
  return false;
}

export const getAllHeaderInfo = (data: StoreData[]) => {
  return data.reduce((acc, item) => {
    const keys = Object.keys(item);
    keys.forEach((key) => {
      const containsImage = imagesFilter(item[key]);
      const keyIndex = acc.findIndex((info) => info[0].includes(key));
      if (keyIndex === -1) {
        acc.push([key, containsImage]);
      } else if (containsImage) {
        acc[keyIndex] = [key, true];
      }
    });
    return acc;
  }, [] as [string, boolean][]);
};

export const dataContainsLocation = (data: StoreData) => {
  return Object.keys(data).some(
    (key) => COORDINATE_KEYS.includes(key) && !!data[key]
  );
};

@Injectable({
  providedIn: 'root',
})
export class DataStoreService {
  private dataStore: StoreData[];
  private selectedData: string | undefined;
  private isPristine = true;

  // Flag to indicate if the data store is in edit mode
  // This can be used to toggle between viewing and editing the data store.
  editMode$ = new Subject<boolean>();

  // Observable to emit new data store updates
  // It does not emit the whole data store, but only the new data added.
  dataStore$ = new Subject<StoreData[]>();

  constructor() {
    this.dataStore = [];
  }

  public setEditMode(mode: boolean) {
    this.editMode$.next(mode);
  }

  public isInEditMode() {
    return this.editMode$.observed;
  }

  public setSelectedData(data: StoreData | undefined) {
    this.selectedData = data ? data[UNIQUE_ID] : undefined;
  }

  public getSelectedData(): string | undefined {
    return this.selectedData;
  }

  public getStore() {
    return [...this.dataStore];
  }

  private getMergedDataAndNewUniqueData(
    newData: StoreData[]
  ): [StoreData[], StoreData[]] {
    const mergedData = mergeStoreData(newData, this.dataStore);
    return [
      mergedData,
      newData.filter(
        (data) =>
          !this.dataStore.length ||
          this.dataStore.some((newItem) => !isEqual(newItem, data))
      ),
    ];
  }

  public store(data: StoreData[], pictures: PictureStore) {
    const [mergedData, newData] = this.getMergedDataAndNewUniqueData(data);
    console.log('New data added', newData);
    console.log('Merged data added', mergedData);
    this.dataStore = mergedData;
    this.isPristine = newData.length === 0;
    this.syncDataStoreWithPictures(pictures, newData);
  }

  public commit() {
    if (!this.isPristine) {
      this.dataStore$.next(this.dataStore);
    }
  }

  public changeStoreData(storeData: StoreData) {
    const { id, ...data } = storeData;
    const itemIndex = this.dataStore.findIndex(
      (data) => data[UNIQUE_ID] === id
    );
    if (itemIndex >= 0) {
      this.dataStore[itemIndex] = {
        ...this.dataStore[itemIndex],
        ...data,
      };
      this.isPristine = false;
      this.dataStore$.next([this.dataStore[itemIndex]]);
      return;
    }
    console.error('changeStoreData failed');
  }

  public syncDataStoreWithPictures(
    pictures: PictureStore,
    dataStore: StoreData[]
  ) {
    dataStore.forEach((data) => {
      const dataSnapShot = {
        ...data,
      };
      this.updateDataStoreWithPicture(data, pictures);
      this.isPristine = this.isPristine && isEqual(dataSnapShot, data);
    });
  }

  private updateDataStoreWithPicture(
    dataStore: StoreData,
    pictures: PictureStore
  ) {
    // Set default column name for picture column incase non exists
    let pictureColumnName = VOORAANZICHT;
    // lookup columns in dataStore that have pictures
    const addressColumnName = getKey(dataStore, ADDRESS_KEYS, '');
    const pictureColumnNames = Object.keys(dataStore).filter(
      (key) => blobsFilter(dataStore[key]) || imagesFilter(dataStore[key])
    );
    // Currently only one picture column is supported
    if (pictureColumnNames.length > 0) {
      pictureColumnName = pictureColumnNames[0];
    }
    Object.keys(pictures).forEach((filename) => {
      // remove .jpg or .jpeg from filename to get the address
      const address = filename.replace(/\.jpg|.jpeg$/, '').toLocaleLowerCase();
      if (
        addressColumnName &&
        dataStore[addressColumnName].toLowerCase() === address
      ) {
        dataStore[pictureColumnName] = filename;
      } else {
        dataStore[pictureColumnName] = dataStore[pictureColumnName] || '';
      }
    });
  }

  public storeGridData(gridData: StoreData) {
    const { id, ...storeData } = gridData;
    const pictureColumnNames = Object.keys(storeData).filter((key) =>
      blobsFilter(storeData[key])
    );
    pictureColumnNames.forEach((colName) => {
      storeData[colName] = getImageName(storeData) ?? 'unknown picture.jpg';
    });
    const itemIndex = this.dataStore.findIndex(
      (data) => data[UNIQUE_ID] === id
    );
    if (itemIndex >= 0) {
      this.dataStore[itemIndex] = {
        ...this.dataStore[itemIndex],
        ...storeData,
      };
      this.isPristine = false;
      this.dataStore$.next([this.dataStore[itemIndex]]);
      return;
    }
    console.error('storeGridData failed');
  }

  public updateGeoPosition(
    id: string,
    longitude: number,
    latitude: number,
    geoPositionInfo: string
  ) {
    let dataChanged = false;
    const itemIndex = this.dataStore.findIndex(
      (data) => data[UNIQUE_ID] === id
    );
    if (itemIndex >= 0) {
      if (this.dataStore[itemIndex][LONGITUDE] !== longitude.toString()) {
        this.dataStore[itemIndex][LONGITUDE] = longitude.toString();
        dataChanged = true;
      }
      if (this.dataStore[itemIndex][LATITUDE] !== latitude.toString()) {
        this.dataStore[itemIndex][LATITUDE] = latitude.toString();
        dataChanged = true;
      }
      if (this.dataStore[itemIndex][GEO_INFO] !== geoPositionInfo) {
        this.dataStore[itemIndex][GEO_INFO] = geoPositionInfo;
        dataChanged = true;
      }
    }
    this.isPristine = !dataChanged;
    return dataChanged;
  }

  public findById(id: string): StoreData | undefined {
    return this.dataStore.find((data) => data[UNIQUE_ID] === id);
  }

  public get(filter: StoreData): StoreData | undefined {
    const filterKeys = Object.keys(filter);
    const foundData = this.dataStore.find((data) => {
      const dataKeys = Object.keys(data);
      return (
        filterKeys.every((filterKey) => dataKeys.includes(filterKey)) &&
        filterKeys.every(
          (
            key // compare values without commas and spaces
          ) =>
            (filter[key] + '').replace(/[,\s].*/g, '').toLowerCase() ===
            (data[key] + '').replace(/[,\s].*/g, '').toLowerCase()
        )
      );
    });
    if (foundData) {
      return Object.assign({}, foundData) as StoreData;
    }
    return undefined;
  }

  private getByPostcodeHouseNumberCity(
    lookupPostcode: string,
    lookupHouseNumber: string,
    lookupCity: string
  ): StoreData | undefined {
    return this.dataStore.find((data) => {
      let found = false;
      const addressKey = ADDRESS_KEYS.find((key) =>
        Object.keys(data).includes(key)
      );
      const postcodeKey = POSTCODE_KEYS.find((key) =>
        Object.keys(data).includes(key)
      );
      if (addressKey && postcodeKey) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [street, houseNumber, city] = data[addressKey]
          .replaceAll(',', '')
          .split(HOUSE_NUMBER_REGEX);
        found =
          lookupPostcode.toLowerCase() === data[postcodeKey].toLowerCase() &&
          lookupCity.toLowerCase() === city.toLowerCase() &&
          lookupHouseNumber.toLowerCase() === houseNumber.toLowerCase();
        if (!found) {
          found =
            lookupPostcode.toLowerCase() === data[postcodeKey].toLowerCase() &&
            lookupCity.toLowerCase() === city.toLowerCase() &&
            lookupHouseNumber.toLowerCase().replace(/[-\s]*/g, '') ===
              houseNumber.toLowerCase().replace(/[-\s]*/g, '');
        }
        if (!found) {
          found =
            lookupPostcode.toLowerCase() === data[postcodeKey].toLowerCase() &&
            lookupCity.toLowerCase() === city.toLowerCase() &&
            lookupHouseNumber.toLowerCase().replace(/[^0-9]*/g, '') ===
              houseNumber.toLowerCase().replace(/[^0-9]*/g, '');
        }
      }
      return found;
    });
  }

  public getByAddr(address: string): StoreData | undefined {
    const foundData = this.findDataByAddress(address);
    if (foundData) {
      return Object.assign({}, foundData) as StoreData;
    }
    return undefined;
  }

  private findDataByAddress(address: string) {
    const lookupAddress = makeAddressComparable(address);
    console.log('Lookup Address', address, lookupAddress);
    return this.dataStore.find((data) => {
      const addressKey = ADDRESS_KEYS.find((key) =>
        Object.keys(data).includes(key)
      );
      if (addressKey) {
        const dataStoreAddress = makeAddressComparable(data[addressKey]);
        return (
          // compare address without commas, spaces and dashes
          dataStoreAddress === lookupAddress
        );
      }
      return false;
    });
  }

  public findByApproach(
    postcode: string,
    houseNumber: string,
    street: string,
    city: string,
    query: string
  ): [StoreData | undefined, string] {
    let errorMessage = '';
    let storeData = this.get({
      [CITY]: city,
      [HOUSE_NUMBER]: houseNumber,
      [POSTCODE]: postcode,
    });
    if (!storeData) {
      storeData = this.getByPostcodeHouseNumberCity(
        postcode,
        houseNumber,
        city
      );
      if (!storeData) {
        // try to get it by street name, city and house number
        storeData = this.get({
          [STREET]: street,
          [HOUSE_NUMBER]: houseNumber,
          [CITY]: city,
        });
        if (!storeData) {
          // try to get it by city, street name and partial house number
          storeData = this.get({
            [STREET]: street,
            // filter house number with for non numbers
            [HOUSE_NUMBER]: houseNumber.replace(/[^0-9,\s].*/g, ''),
            [CITY]: city,
          });
          if (!storeData) {
            // try to get it by postcode, street name, partial house number.
            storeData = this.get({
              [POSTCODE]: postcode,
              [STREET]: street,
              [HOUSE_NUMBER]: houseNumber.replace(/[^0-9].*/g, ''),
            });
            if (!storeData) {
              // try to get it by postcode, partial house number, city
              storeData = this.get({
                [POSTCODE]: postcode,
                [CITY]: city,
                [HOUSE_NUMBER]: houseNumber.replace(/[^0-9].*/g, ''),
              });
              if (!storeData) {
                // try to get it by address.
                storeData = this.getByAddr(`${street} ${houseNumber} ${city}`);
                if (!storeData) {
                  errorMessage = `Looking for ${query} but found address "${street} ${houseNumber}, ${city}, ${postcode}". Please verify address in the excel sheet.`;
                  storeData = this.getByAddr(query);
                  if (!storeData) {
                    // try without postcode
                    storeData = this.getByAddr(
                      query
                        .replace(/[1-9][0-9]{3} ?(?!sa|sd|ss)[a-z]{2}$/i, '')
                        .trim()
                    );
                  }
                }
              } else {
                errorMessage = `Please fix City in "${street} ${houseNumber}, ${city}" and change ${storeData[CITY]} to ${city} in your excel sheet.`;
              }
            }
          } else {
            errorMessage = `Please fix house number in "${street} ${houseNumber}, ${city}" and change ${storeData[HOUSE_NUMBER]} to ${houseNumber} in your excel sheet.`;
          }
        } else {
          errorMessage = `Please fix postcode in "${street} ${houseNumber}, ${city}" and change ${storeData[POSTCODE]} to ${postcode} in your excel sheet.`;
        }
      }
    }

    console.log('street map found', postcode, houseNumber, city, street, query);
    return [storeData, errorMessage];
  }
}
