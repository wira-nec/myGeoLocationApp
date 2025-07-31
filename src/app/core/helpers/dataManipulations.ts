import { StoreData, getDataStoreKeys } from '../services/data-store.service';

export function blobsFilter(value: string): boolean {
  return /^(data:image\/)/i.test(value);
}

export function getAddress(item: StoreData): string {
  const [addressKey, streetKey, postcodeKey, houseNumberKey, cityKey] =
    getDataStoreKeys(item);
  if (!item || !item[cityKey] || !item[postcodeKey] || !item[houseNumberKey]) {
    if (!item || !item[addressKey]) {
      throw new Error('Item has no valid address fields');
    } else {
      return item[addressKey];
    }
  } else {
    return item[cityKey] + item[streetKey] + item[houseNumberKey];
  }
}

export function mergeStoreData(
  newData: StoreData[],
  storeData: StoreData[]
): StoreData[] {
  const map = new Map();
  storeData.forEach((item) => map.set(getAddress(item), item));
  newData.forEach((item) =>
    map.set(getAddress(item), {
      ...map.get(getAddress(item)),
      ...item,
    })
  );
  return Array.from(map.values()) as StoreData[];
}
