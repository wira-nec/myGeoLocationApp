import { mergeStoreData } from './dataManipulations';
import {
  CITY,
  POSTCODE,
  HOUSE_NUMBER,
  StoreData,
} from '../services/data-store.service';

describe('mergeStoreData', () => {
  const makeItem = (
    city: string,
    postcode: string,
    houseNumber: string,
    extra?: object
  ): StoreData => ({
    [CITY]: city,
    [POSTCODE]: postcode,
    [HOUSE_NUMBER]: houseNumber,
    ...extra,
  });

  it('should return the same array if both arrays are identical', () => {
    const arr = [
      makeItem('A', '1000', '1', { foo: 'bar' }),
      makeItem('B', '2000', '2', { foo: 'baz' }),
    ];
    const result = mergeStoreData([...arr], [...arr]);
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      expect.objectContaining(arr[0]),
      expect.objectContaining(arr[1]),
    ]);
  });

  it('should handle arrays with no overlapping keys', () => {
    const arr1 = [makeItem('A', '1000', '1')];
    const arr2 = [makeItem('B', '2000', '2')];
    const result = mergeStoreData(arr1, arr2);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining(arr1[0]),
        expect.objectContaining(arr2[0]),
      ])
    );
  });

  it('should merge completely different arrays', () => {
    const arr1 = [makeItem('A', '1000', '1', { foo: 'bar' })];
    const arr2 = [makeItem('B', '2000', '2', { foo: 'baz' })];
    const result = mergeStoreData(arr1, arr2);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining(arr1[0]),
        expect.objectContaining(arr2[0]),
      ])
    );
  });

  it('should merge overlapping arrays and prefer newData fields', () => {
    const base = makeItem('A', '1000', '1', { foo: 'bar', old: 'yes' });
    const overlap = makeItem('A', '1000', '1', { foo: 'baz', new: 'yes' });
    const arr1 = [base];
    const arr2 = [overlap];
    const result = mergeStoreData(arr2, arr1);
    expect(result).toHaveLength(1);
    expect(result[0][CITY]).toBe('A');
    expect(result[0][POSTCODE]).toBe('1000');
    expect(result[0][HOUSE_NUMBER]).toBe('1');
    expect(result[0]['foo']).toBe('baz'); // newData wins
    expect(result[0]['old']).toBe('yes'); // old field preserved if not overwritten
    expect(result[0]['new']).toBe('yes'); // new field added
  });

  it('should handle empty arrays', () => {
    const arr1: StoreData[] = [];
    const arr2: StoreData[] = [];
    expect(mergeStoreData(arr1, arr2)).toEqual([]);
    expect(
      mergeStoreData(arr1, [
        { [CITY]: 'A', [POSTCODE]: '1000', [HOUSE_NUMBER]: '1' },
      ])
    ).toEqual([{ [CITY]: 'A', [POSTCODE]: '1000', [HOUSE_NUMBER]: '1' }]);
    expect(
      mergeStoreData(
        [{ [CITY]: 'A', [POSTCODE]: '1000', [HOUSE_NUMBER]: '1' }],
        arr2
      )
    ).toEqual([{ [CITY]: 'A', [POSTCODE]: '1000', [HOUSE_NUMBER]: '1' }]);
  });
});

describe('blobsFilter', () => {
  const blobsFilter = (value: string): boolean =>
    /^(data:image\/)/i.test(value);

  it('should return true for valid image data URIs', () => {
    expect(
      blobsFilter('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA')
    ).toBe(true);
    expect(
      blobsFilter('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/')
    ).toBe(true);
  });

  it('should return false for non-image data URIs', () => {
    expect(blobsFilter('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==')).toBe(
      false
    );
    expect(blobsFilter('data:application/json,{"key":"value"}')).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(blobsFilter('')).toBe(false);
  });

  it('should return false for non-data URIs', () => {
    expect(blobsFilter('https://example.com/image.png')).toBe(false);
    expect(blobsFilter('ftp://example.com/file.txt')).toBe(false);
  });
});
