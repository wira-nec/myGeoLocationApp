import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type StoreData = Record<string, string>;

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
            (key === 'housenumber' &&
              filter[key].includes('-') &&
              filter[key].split('-').at(-1) === data[key])
        )
      );
    });
  }
}
