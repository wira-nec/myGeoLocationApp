import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { blobsFilter, mergeStoreData } from '../app/helpers/dataManipulations';
import { isEqual } from 'lodash';

export type StoreData = Record<string, string>;

export const POSTCODE = 'postcode';
export const CITY = 'city';
export const HOUSE_NUMBER = 'housenumber';
export const INFO = 'userPositionInfo';
export const STREET = 'street';
export const LONGITUDE = 'longitude';
export const LATITUDE = 'latitude';
export const FIRST_NAME = 'firstName';
export const COORDINATE_KEYS: string[] = [LONGITUDE, LATITUDE];

export const imagesFilter = (value: string): boolean => {
  return /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(value);
};

export const getAddress = (data: StoreData) => [
  data[POSTCODE].replaceAll(' ', ''),
  data[CITY],
  data[HOUSE_NUMBER].toString(),
  data[STREET],
];

export const getImageNames = (details: StoreData) => {
  return Object.values(details).filter((value) => imagesFilter(value));
};

export const getBlobs = (details: StoreData) => {
  return Object.values(details).filter((value) => blobsFilter(value));
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
          (key) =>
            (filter[key] + '').toLowerCase() === (data[key] + '').toLowerCase()
        )
      );
    });
    if (foundData) {
      return Object.assign({}, foundData) as StoreData;
    }
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public findByApproach(originalDetails: any): [StoreData | undefined, string] {
    let errorMessage = '';
    let storeData = this.get({
      [POSTCODE]: originalDetails.postcode,
      [HOUSE_NUMBER]: originalDetails.housenumber,
      [CITY]: originalDetails.city,
    });
    if (!storeData) {
      // try to get it by street name, city and house number
      storeData = this.get({
        [STREET]: originalDetails.street,
        [HOUSE_NUMBER]: originalDetails.housenumber,
        [CITY]: originalDetails.city,
      });
      if (!storeData) {
        // try to get it by city, street name and partial house number
        storeData = this.get({
          [STREET]: originalDetails.street,
          // filter house number with for non numbers
          [HOUSE_NUMBER]: originalDetails.housenumber.replace(/[^0-9].*/g, ''),
          [CITY]: originalDetails.city,
        });
        if (!storeData) {
          // try to get it by postcode, street name, partial house number.
          storeData = this.get({
            [POSTCODE]: originalDetails.postcode,
            [STREET]: originalDetails.street,
            [HOUSE_NUMBER]: originalDetails.housenumber.replace(
              /[^0-9].*/g,
              ''
            ),
          });
          if (!storeData) {
            errorMessage = `Looking for ${originalDetails.query} but found address "${originalDetails.postcode} ${originalDetails.housenumber}, ${originalDetails.city}" which is not present your excel sheet. Please check the address in the imported excel sheet.`;
          } else {
            errorMessage = `Please fix City in "${originalDetails.street} ${originalDetails.housenumber}, ${originalDetails.city}" and change ${storeData[CITY]} to ${originalDetails.city} in your excel sheet.`;
            storeData[CITY] = originalDetails.city;
            storeData[HOUSE_NUMBER] = originalDetails.housenumber;
          }
        } else {
          errorMessage = `Please fix house number in "${originalDetails.street} ${originalDetails.housenumber}, ${originalDetails.city}" and change ${storeData[HOUSE_NUMBER]} to ${originalDetails.housenumber} in your excel sheet.`;
          storeData[HOUSE_NUMBER] = originalDetails.housenumber;
        }
      } else {
        errorMessage = `Please fix postcode in "${originalDetails.street} ${originalDetails.housenumber}, ${originalDetails.city}" and change ${storeData[POSTCODE]} to ${originalDetails.postcode} in your excel sheet.`;
        storeData[POSTCODE] = originalDetails.postcode;
      }
    }
    console.log('street map found', originalDetails);
    return [storeData, errorMessage];
  }
}
