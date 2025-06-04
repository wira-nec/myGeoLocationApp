import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { blobsFilter, mergeStoreData } from '../helpers/dataManipulations';
import { isEqual } from 'lodash';

export type StoreData = Record<string, string>;

export const ADDRESS = 'address';
export const POSTCODE = 'postcode';
export const CITY = 'city';
export const HOUSE_NUMBER = 'housenumber';
export const INFO = 'geoPositionInfo';
export const STREET = 'street';
export const LONGITUDE = 'longitude';
export const LATITUDE = 'latitude';
export const FIRST_NAME = 'firstName';
export const SHEET_NAME = 'sheetName';
export const COORDINATE_KEYS: string[] = [LONGITUDE, LATITUDE];

const ADDRESS_KEYS: string[] = ['adres', 'Adres', 'address', 'Address'];
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
  return /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(value);
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
      data[streetKey].trim(),
      data[houseNumberKey].toString().trim(),
      data[cityKey].trim(),
      data[postcodeKey].replaceAll(' ', ''),
    ];
  }
};

export const getImageNames = (details: StoreData) => {
  const addressKey = getKey(details, ADDRESS_KEYS, '');
  if (details[addressKey]) {
    const [street, houseNumber, city] =
      details[addressKey].split(HOUSE_NUMBER_REGEX);
    return [
      `${street.trim()} ${houseNumber.trim()} ${city.trim()}.jpg`.toLowerCase(),
    ];
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

export const getAllKeys = (data: StoreData[]) => {
  return data.reduce((acc, item) => {
    const keys = Object.keys(item);
    keys.forEach((key) => {
      if (!acc.includes(key)) {
        acc.push(key);
      }
    });
    return acc;
  }, [] as string[]);
};

@Injectable({
  providedIn: 'root',
})
export class DataStoreService {
  private dataStore: StoreData[];
  private lastNumberOfDataRecordsAdded = 0;

  // Observable to emit new data store updates
  // It does not emit the whole data store, but only the new data added.
  dataStore$ = new Subject<StoreData[]>();
  keys = {};
  constructor() {
    this.dataStore = [];
  }

  public getIncreasedDataStoreSize() {
    console.log('Increased data store size', this.lastNumberOfDataRecordsAdded);
    return this.lastNumberOfDataRecordsAdded;
  }

  public getNumberOfAddedLocationRecords() {
    return this.dataStore
      .slice(-this.lastNumberOfDataRecordsAdded)
      .filter((data) => {
        const dataKeys = Object.keys(data);
        return (
          dataKeys.includes(LONGITUDE) &&
          dataKeys.includes(LATITUDE) &&
          dataKeys.includes(INFO)
        );
      }).length;
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

  public store(data: StoreData[]) {
    const [mergedData, newData] = this.getMergedDataAndNewUniqueData(data);
    console.log('New data added', newData);
    console.log('Merged data added', mergedData);
    this.lastNumberOfDataRecordsAdded =
      mergedData.length - this.dataStore.length;
    this.keys = getAllKeys(this.dataStore);
    this.dataStore = mergedData;
    this.dataStore$.next(newData);
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

  public getByAddr(address: string): StoreData | undefined {
    const foundData = this.dataStore.find((data) => {
      const addressKey = ADDRESS_KEYS.find((key) =>
        Object.keys(data).includes(key)
      );
      return (
        addressKey &&
        // compare address without commas, spaces and dashes
        (data[addressKey] + '').replaceAll(/(,|-|\s)/g, '').toLowerCase() ===
          address.replaceAll(/(,|-|\s)/g, '').toLowerCase()
      );
    });
    if (foundData) {
      return Object.assign({}, foundData) as StoreData;
    }
    return undefined;
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
      [POSTCODE]: postcode,
      [HOUSE_NUMBER]: houseNumber,
      [CITY]: city,
    });
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
            // try to get it by address.
            storeData = this.getByAddr(`${street} ${houseNumber} ${city}`);
            if (!storeData) {
              errorMessage = `Looking for ${query} but found address "${street} ${houseNumber}, ${city}, ${postcode}". Please verify address in the excel sheet.`;
            }
          } else {
            errorMessage = `Please fix City in "${street} ${houseNumber}, ${city}" and change ${storeData[CITY]} to ${city} in your excel sheet.`;
            storeData[CITY] = city;
            storeData[HOUSE_NUMBER] = houseNumber;
          }
        } else {
          errorMessage = `Please fix house number in "${street} ${houseNumber}, ${city}" and change ${storeData[HOUSE_NUMBER]} to ${houseNumber} in your excel sheet.`;
          storeData[HOUSE_NUMBER] = houseNumber;
        }
      } else {
        errorMessage = `Please fix postcode in "${street} ${houseNumber}, ${city}" and change ${storeData[POSTCODE]} to ${postcode} in your excel sheet.`;
        storeData[POSTCODE] = postcode;
      }
    }
    console.log('street map found', postcode, houseNumber, city, street, query);
    return [storeData, errorMessage];
  }
}
