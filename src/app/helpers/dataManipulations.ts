import {
  StoreData,
  CITY,
  POSTCODE,
  HOUSE_NUMBER,
} from '../../services/data-store.service';

export function blobsFilter(value: string): boolean {
  return /^(data:image\/)/i.test(value);
}

export function mergeStoreData(
  newData: StoreData[],
  storeData: StoreData[]
): StoreData[] {
  const map = new Map();
  storeData.forEach((item) =>
    map.set(item[CITY] + item[POSTCODE] + item[HOUSE_NUMBER], item)
  );
  newData.forEach((item) =>
    map.set(item[CITY] + item[POSTCODE] + item[HOUSE_NUMBER], {
      ...map.get(item[CITY] + item[POSTCODE] + item[HOUSE_NUMBER]),
      ...item,
    })
  );
  return Array.from(map.values()) as StoreData[];
}
