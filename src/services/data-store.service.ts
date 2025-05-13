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
export const INFO = 'info';
export const FIRST_NAME = 'firstName';
export const COORDINATE_KEYS: string[] = [LONGITUDE, LATITUDE];

export const imagesFilter = (value: string): boolean => {
  return /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(value);
};

export const getAddress = (data: StoreData): string => {
  return `${data[FIXED_DETAIL_COLUMNS[0]]}, ${data[FIXED_DETAIL_COLUMNS[1]]}, ${
    data[FIXED_DETAIL_COLUMNS[2]]
  }`;
};

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

  dataStore$ = new BehaviorSubject<StoreData[]>([]);

  constructor() {
    this.dataStore = [];
  }

  public getDataStoreSize() {
    return this.dataStore.length;
  }

  public getStore() {
    return [...this.dataStore];
  }

  public store(info: StoreData[]) {
    this.dataStore = info;
    this.dataStore$.next(info);
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
}
