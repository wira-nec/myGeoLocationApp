import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { blobsFilter } from '../app/helpers/dataManipulations';

export type StoreData = Record<string, string>;

export const FIXED_DETAIL_COLUMNS = [
  'postcode',
  'city',
  'housenumber',
  'userPositionInfo',
];

export const LONGITUDE = 'longitude';
export const LATITUDE = 'latitude';
export const INFO = 'userPositionInfo';
export const FIRST_NAME = 'firstName';
export const COORDINATE_KEYS: string[] = [LONGITUDE, LATITUDE];

export const imagesFilter = (value: string): boolean => {
  return /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(value);
};

export const getAddress = (data: StoreData) => [
  data[FIXED_DETAIL_COLUMNS[0]],
  data[FIXED_DETAIL_COLUMNS[1]],
  data[FIXED_DETAIL_COLUMNS[2]].toString(),
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

  dataStore$ = new BehaviorSubject<StoreData[]>([]);

  constructor() {
    this.dataStore = [];
  }

  public getIncreasedDataStoreSize() {
    return this.lastNumberOfDataRecordsAdded;
  }

  public getStore() {
    return [...this.dataStore];
  }

  public store(info: StoreData[]) {
    const newInfo = this.mergeById(info, this.dataStore);
    console.log(newInfo);
    const allData = this.mergeWithDataStore(info);
    console.log(allData);

    this.lastNumberOfDataRecordsAdded = allData.length - this.dataStore.length;
    this.dataStore = allData;
    this.dataStore$.next(newInfo);
  }

  public get(filter: StoreData): StoreData | undefined {
    const filterKeys = Object.keys(filter);
    return this.dataStore.find((data) => {
      const dataKeys = Object.keys(data);
      return (
        filterKeys.every((filterKey) => dataKeys.includes(filterKey)) &&
        filterKeys.every(
          (key) =>
            (filter[key] + '').toLowerCase() ===
              (data[key] + '').toLowerCase() ||
            (key === FIXED_DETAIL_COLUMNS[2] &&
              filter[key].includes('-') &&
              filter[key].split('-').at(-1) === data[key])
        )
      );
    });
  }

  private mergeById(a1: StoreData[], a2: StoreData[]) {
    return a1.map((itm) => ({
      ...a2.find(
        (item) =>
          item[FIXED_DETAIL_COLUMNS[0]] === itm[FIXED_DETAIL_COLUMNS[0]] &&
          item[FIXED_DETAIL_COLUMNS[1]] === itm[FIXED_DETAIL_COLUMNS[1]] &&
          item[FIXED_DETAIL_COLUMNS[2]] === itm[FIXED_DETAIL_COLUMNS[2]] &&
          item
      ),
      ...itm,
    }));
  }

  private mergeWithDataStore(info: StoreData[]) {
    const map = new Map();
    this.dataStore.forEach((item) =>
      map.set(
        item[FIXED_DETAIL_COLUMNS[0]] +
          item[FIXED_DETAIL_COLUMNS[1]] +
          item[FIXED_DETAIL_COLUMNS[2]],
        item
      )
    );
    info.forEach((item) =>
      map.set(
        item[FIXED_DETAIL_COLUMNS[0]] +
          item[FIXED_DETAIL_COLUMNS[1]] +
          item[FIXED_DETAIL_COLUMNS[2]],
        {
          ...map.get(
            item[FIXED_DETAIL_COLUMNS[0]] +
              item[FIXED_DETAIL_COLUMNS[1]] +
              item[FIXED_DETAIL_COLUMNS[2]]
          ),
          ...item,
        }
      )
    );
    const allData = Array.from(map.values());
    return allData;
  }
}
