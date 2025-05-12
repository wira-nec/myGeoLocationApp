import { StoreData } from '../../services/data-store.service';

export const LONGITUDE = 'longitude';
export const LATITUDE = 'latitude';
export const INFO = 'info';
export const COORDINATE_KEYS: string[] = [LONGITUDE, LATITUDE];

export function imagesFilter(value: string): boolean {
  return /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(value);
}

export function blobsFilter(value: string): boolean {
  return /^(data:image\/)/i.test(value);
}

export function getImageNames(details: StoreData) {
  return Object.values(details).filter((value) => imagesFilter(value));
}

export function getBlobs(details: StoreData) {
  return Object.values(details).filter((value) => blobsFilter(value));
}
