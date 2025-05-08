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

  public store(info: StoreData[]) {
    const newInfo = info.filter((newData) =>
      this.dataStore.every(
        (storedData) =>
          !Object.keys(storedData).every((k) => newData[k] === storedData[k])
      )
    );
    this.dataStore = this.dataStore.concat(newInfo);
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
            (key === 'housenumber' &&
              filter[key].includes('-') &&
              filter[key].split('-').at(-1) === data[key])
        )
      );
    });
  }
}
