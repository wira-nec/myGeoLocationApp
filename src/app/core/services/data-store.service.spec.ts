import {
  CITY,
  DataStoreService,
  HOUSE_NUMBER,
  GEO_INFO,
  LATITUDE,
  LONGITUDE,
  POSTCODE,
  StoreData,
  STREET,
} from './data-store.service';

describe('DataStoreService', () => {
  let service: DataStoreService;

  beforeEach(() => {
    service = new DataStoreService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getIncreasedDataStoreSize', () => {
    it('should return 0 initially', () => {
      expect(service.getIncreasedDataStoreSize()).toBe(0);
    });
    it('should return the number of new records added after store()', () => {
      const data: StoreData[] = [
        { [CITY]: 'A', [POSTCODE]: '1', [HOUSE_NUMBER]: '1' },
        { [CITY]: 'B', [POSTCODE]: '2', [HOUSE_NUMBER]: '2' },
      ];
      service.store(data);
      expect(service.getIncreasedDataStoreSize()).toBe(2);
      service.store([
        { [CITY]: 'A', [POSTCODE]: '1', [HOUSE_NUMBER]: '1' }, // duplicate
        { [CITY]: 'C', [POSTCODE]: '3', [HOUSE_NUMBER]: '3' },
      ]);
      expect(service.getIncreasedDataStoreSize()).toBe(1);
    });
  });

  describe('getNumberOfAddedLocationRecords', () => {
    it('should return 0 if no records have location info', () => {
      service.store([
        { [CITY]: 'A', [POSTCODE]: '1', [HOUSE_NUMBER]: '1' },
        { [CITY]: 'B', [POSTCODE]: '2', [HOUSE_NUMBER]: '2' },
      ]);
      expect(service.getNumberOfAddedLocationRecords()).toBe(0);
    });
    it('should count only records with LONGITUDE, LATITUDE, and INFO', () => {
      service.store([
        {
          [CITY]: 'A',
          [POSTCODE]: '1',
          [HOUSE_NUMBER]: '1',
          [LONGITUDE]: '1',
          [LATITUDE]: '2',
          [GEO_INFO]: 'x',
        },
        { [CITY]: 'B', [POSTCODE]: '2', [HOUSE_NUMBER]: '2' },
      ]);
      expect(service.getNumberOfAddedLocationRecords()).toBe(1);
    });
    it('should return 0 if no new records were added', () => {
      service.store([
        {
          [CITY]: 'A',
          [POSTCODE]: '1',
          [HOUSE_NUMBER]: '1',
          [LONGITUDE]: '1',
          [LATITUDE]: '2',
          [GEO_INFO]: 'x',
        },
      ]);
      service.store([
        {
          [CITY]: 'A',
          [POSTCODE]: '1',
          [HOUSE_NUMBER]: '1',
          [LONGITUDE]: '1',
          [LATITUDE]: '2',
          [GEO_INFO]: 'x',
        },
      ]);
      expect(service.getIncreasedDataStoreSize()).toBe(0);
    });
  });

  describe('getStore', () => {
    it('should return an empty array initially', () => {
      expect(service.getStore()).toEqual([]);
    });
    it('should return a copy of the dataStore', () => {
      const data: StoreData[] = [
        { [CITY]: 'A', [POSTCODE]: '1', [HOUSE_NUMBER]: '1' },
      ];
      service.store(data);
      const store = service.getStore();
      expect(store).toEqual(data);
      expect(store).not.toBe(service['dataStore']);
    });
  });

  describe('store', () => {
    it('should add new data and emit new data only', (done) => {
      const data: StoreData[] = [
        { [CITY]: 'A', [POSTCODE]: '1', [HOUSE_NUMBER]: '1' },
        { [CITY]: 'B', [POSTCODE]: '2', [HOUSE_NUMBER]: '2' },
      ];
      service.dataStore$.subscribe((newData) => {
        expect(newData).toEqual(data);
        done();
      });
      service.store(data);
    });

    it('should merge data and emit only truly new or changed records', (done) => {
      const data1: StoreData[] = [
        { [CITY]: 'A', [POSTCODE]: '1', [HOUSE_NUMBER]: '1', foo: 'bar' },
      ];
      const data2: StoreData[] = [
        { [CITY]: 'A', [POSTCODE]: '1', [HOUSE_NUMBER]: '1', foo: 'baz' }, // overlap
        { [CITY]: 'B', [POSTCODE]: '2', [HOUSE_NUMBER]: '2' },
      ];
      service.store(data1);
      service.dataStore$.subscribe((newData) => {
        expect(newData).toEqual(data2);
        done();
      });
      service.store(data2);
    });

    it('should handle empty input', (done) => {
      service.dataStore$.subscribe((newData) => {
        expect(newData).toEqual([]);
        done();
      });
      service.store([]);
    });
  });

  describe('get', () => {
    it('should return undefined if not found', () => {
      expect(service.get({ [CITY]: 'X' })).toBeUndefined();
    });
    it('should return a copy of the found data', () => {
      const data: StoreData = {
        [CITY]: 'A',
        [POSTCODE]: '1',
        [HOUSE_NUMBER]: '1',
        foo: 'bar',
      };
      service.store([data]);
      const found = service.get({
        [CITY]: 'A',
        [POSTCODE]: '1',
        [HOUSE_NUMBER]: '1',
      });
      expect(found).toEqual(data);
      expect(found).not.toBe(data);
    });
    it('should match case-insensitively', () => {
      const data: StoreData = {
        [CITY]: 'A',
        [POSTCODE]: '1',
        [HOUSE_NUMBER]: '1',
      };
      service.store([data]);
      expect(
        service.get({ [CITY]: 'a', [POSTCODE]: '1', [HOUSE_NUMBER]: '1' })
      ).toEqual(data);
    });
    it('should return undefined for empty filter', () => {
      expect(service.get({})).toBeUndefined();
    });
  });

  describe('findByApproach', () => {
    const base: StoreData = {
      [CITY]: 'A',
      [POSTCODE]: '1',
      [HOUSE_NUMBER]: '1',
      [STREET]: 'Main',
    };

    beforeEach(() => {
      service.store([base]);
    });

    it('should find by postcode, houseNumber, city', () => {
      const [found, msg] = service.findByApproach(
        '1',
        '1',
        'Main',
        'A',
        'query'
      );
      expect(found).toBeTruthy();
      expect(msg).toBe('');
    });

    it('should try street, houseNumber, city if not found by postcode', () => {
      const [found, msg] = service.findByApproach(
        '999',
        '1',
        'Main',
        'A',
        'query'
      );
      expect(found).toBeTruthy();
      expect(msg).toMatch(/fix postcode/i);
    });

    it('should try street, partial houseNumber, city if not found by street', () => {
      const [found, msg] = service.findByApproach(
        '999',
        '1a',
        'Main',
        'A',
        'query'
      );
      expect(found).toBeTruthy();
      expect(msg).toMatch(/fix house number/i);
    });

    it('should try postcode, street, partial houseNumber if not found by previous', () => {
      const [found, msg] = service.findByApproach(
        '1',
        '1a',
        'Main',
        'B',
        'query'
      );
      expect(found).toBeTruthy();
      expect(msg).toMatch(/fix City/i);
    });

    it('should return error if nothing found', () => {
      const [found, msg] = service.findByApproach(
        '999',
        '999',
        'Unknown',
        'Z',
        'query'
      );
      expect(found).toBeUndefined();
      expect(msg).toMatch(/not present/i);
    });

    it('should handle empty input gracefully', () => {
      const [found, msg] = service.findByApproach('', '', '', '', '');
      expect(found).toBeUndefined();
      expect(msg).toMatch(/not present/i);
    });
  });
});
