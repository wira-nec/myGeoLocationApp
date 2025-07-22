import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousesMapComponent } from './houses-map.component';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Map } from 'ol';
import { DestroyRef } from '@angular/core';
import { setUpMockedServices } from '../../../../test/setUpMockedServices';
import * as olProj from 'ol/proj';
import * as geocoderCreator from '../helpers/geocoderCreator';
import { Markers } from '../providers/markers';
import { waitFor } from '@testing-library/angular';

const destroyRefMock = {
  onDestroy: jest.fn(),
};

jest.mock('../controls/importFilesControl/importFilesControl', () => ({
  __esModule: true,
  ImportFilesControl: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    setMap: jest.fn(),
  })),
}));

// Helper function to create component instance
function createComponent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geoPositionServiceMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataStoreServiceMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pictureStoreMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markersMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toasterMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  progressServiceMock: any
) {
  const component = new HousesMapComponent(
    dataStoreServiceMock,
    pictureStoreMock,
    toasterMock,
    progressServiceMock
  );
  component.map = mapMock as Map;
  return component;
}

describe('HousesMapComponent', () => {
  let component: HousesMapComponent;
  let fixture: ComponentFixture<HousesMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousesMapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HousesMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('HousesMapComponent ngAfterViewInit', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let geoPositionServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dataStoreServiceMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pictureStoreMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let markersMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let toasterMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mapMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let viewMock: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let progressServiceMock: any;
  let requestLocationSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mocks
    ({
      geoPositionServiceMock,
      dataStoreServiceMock,
      pictureStoreMock,
      markersMock,
      toasterMock,
      viewMock,
      mapMock,
      requestLocationSpy,
      progressServiceMock,
    } = setUpMockedServices());
    // Patch geocoderCreator
    jest.spyOn(geocoderCreator, 'geocoderCreator').mockReturnValue({});

    // Patch fromLonLat
    jest.spyOn(olProj, 'fromLonLat').mockImplementation((coords) => coords);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should subscribe to geoPositions$ and call setupMap when geoPositions is non-empty', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Markers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        geoPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock,
        progressServiceMock
      );
      component.ngAfterViewInit();
      geoPositionServiceMock.geoPositions$.next([{ lat: 1, lon: 2 }]);
      expect(markersMock.setupMap).toHaveBeenCalledWith(
        [{ lat: 1, lon: 2 }],
        viewMock
      );
    });
  });

  it('should not call setupMap when geoPositions is empty', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Markers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        geoPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock,
        progressServiceMock
      );
      component.ngAfterViewInit();
      geoPositionServiceMock.geoPositions$.next([]);
      expect(markersMock.setupMap).not.toHaveBeenCalled();
    });
  });

  it('should process dataStore$ with location and call updateGeoPosition and storePicture', () => {
    const data = [
      {
        longitude: '5',
        latitude: '6',
        postcode: '12345',
        city: 'Test City',
        housenumber: 123,
        firstName: 'John',
        geoPositionInfo: 'info',
        'img.jpg': 'this is a blob',
      },
    ];

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Markers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext(async (): Promise<void> => {
      // Create component
      const component = createComponent(
        geoPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock,
        progressServiceMock
      );
      component.ngAfterViewInit();
      dataStoreServiceMock.dataStore$.next(data);

      expect(geoPositionServiceMock.updateGeoPosition).toHaveBeenCalledWith(
        5,
        6,
        'John',
        data[0],
        'info'
      );
      expect(pictureStoreMock.storePicture).toHaveBeenCalledWith(
        'this is a blob',
        'img.jpg'
      );
      await waitFor(() => {
        expect(viewMock.animate).toHaveBeenCalled();
      });
    });
  });

  it('should process dataStore$ without location and call requestLocation', () => {
    const data = [
      {
        notLongitude: 'x',
        notLatitude: 'y',
        postcode: '12345',
        city: 'Test City',
        housenumber: 123,
      },
    ];

    geoPositionServiceMock.getGeoPositionByAddress.mockReturnValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Markers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        geoPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock,
        progressServiceMock
      );
      component.ngAfterViewInit();
      dataStoreServiceMock.dataStore$.next(data);

      expect(requestLocationSpy).toHaveBeenCalledWith(data[0]);
    });
  });

  it('should call toaster.show if requestLocation throws', () => {
    const data = [
      {
        notLongitude: 'x',
        notLatitude: 'y',
        postcode: '12345',
        city: 'Test City',
        housenumber: 123,
      },
    ];

    geoPositionServiceMock.getGeoPositionByAddress.mockReturnValue(undefined);
    requestLocationSpy.mockImplementation(() => {
      throw new Error('fail');
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Markers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        geoPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock,
        progressServiceMock
      );
      component.ngAfterViewInit();
      dataStoreServiceMock.dataStore$.next(data);

      expect(toasterMock.show).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('location request(s) failed'),
        expect.any(Array),
        600000
      );
    });
  });

  it('should update geoPosition if getGeoPositionByAddress returns a geoPosition', () => {
    const data = [
      {
        notLongitude: 'x',
        notLatitude: 'y',
        postcode: '12345',
        city: 'Test City',
        housenumber: 123,
      },
    ];

    geoPositionServiceMock.getGeoPositionByAddress.mockReturnValue({
      userName: 'Jane',
      geoPositionInfo: 'info',
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Markers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        geoPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock,
        progressServiceMock
      );
      component.ngAfterViewInit();
      dataStoreServiceMock.dataStore$.next(data);

      expect(geoPositionServiceMock.updateGeoPosition).toHaveBeenCalledWith(
        0,
        0,
        'Jane',
        data[0],
        'info'
      );
    });
  });

  it('should unsubscribe from subscriptions on destroy', async () => {
    // Patch inject to return destroyRefMock
    jest.mock(`@angular/core`, () => ({
      ...jest.requireActual('@angular/core'),
      inject: jest.fn().mockReturnValue(destroyRefMock),
    }));

    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();
    // Patch subscribe to return objects with unsubscribe
    geoPositionServiceMock.geoPositions$.pipe = jest.fn().mockReturnValue({
      subscribe: jest.fn().mockReturnValue({ unsubscribe: unsubscribe1 }),
    });
    dataStoreServiceMock.dataStore$.pipe = jest.fn().mockReturnValue({
      subscribe: jest.fn().mockReturnValue({ unsubscribe: unsubscribe2 }),
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Markers,
          useValue: markersMock,
        },
      ],
    });
    await TestBed.configureTestingModule({
      imports: [HousesMapComponent],
      providers: [
        { provide: DestroyRef, useValue: destroyRefMock }, // Mock the DestroyRef
        {
          provide: DataStoreService, // Mock the DataStoreService
          useValue: dataStoreServiceMock,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HousesMapComponent);
    const component = fixture.componentInstance;
    component.map = mapMock as Map;

    component.ngAfterViewInit();
    // Simulate destroy callback
    fixture.destroy();

    expect(unsubscribe1).toHaveBeenCalled();
    expect(unsubscribe2).toHaveBeenCalled();
  });
});
