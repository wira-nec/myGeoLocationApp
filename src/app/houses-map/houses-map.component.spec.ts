import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousesMapComponent } from './houses-map.component';
import { DataStoreService } from '../../services/data-store.service';
import { Map } from 'ol';
import { DestroyRef } from '@angular/core';
import { UserPositionService } from '../../services/user-position.service';
import { setUpMockedServices } from '../../test/setUpMockedServices';
import * as olProj from 'ol/proj';
import * as geocoderCreator from '../helpers/geocoderCreator';
import { UserMarkers } from '../helpers/userMarkers';

const destroyRefMock = {
  onDestroy: jest.fn(),
};

jest.mock('../mapControls/importFilesControl/importFilesControl', () => ({
  __esModule: true,
  ImportFilesControl: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    setMap: jest.fn(),
  })),
}));

// Helper function to create component instance
function createComponent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userPositionServiceMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataStoreServiceMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pictureStoreMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markersMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toasterMock: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapMock: any
) {
  const component = new HousesMapComponent(
    userPositionServiceMock,
    dataStoreServiceMock,
    pictureStoreMock,
    toasterMock
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
  let userPositionServiceMock: any;
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
  let requestLocationSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mocks
    ({
      userPositionServiceMock,
      dataStoreServiceMock,
      pictureStoreMock,
      markersMock,
      toasterMock,
      viewMock,
      mapMock,
      requestLocationSpy,
    } = setUpMockedServices());
    // Patch geocoderCreator
    jest.spyOn(geocoderCreator, 'geocoderCreator').mockReturnValue({});

    // Patch fromLonLat
    jest.spyOn(olProj, 'fromLonLat').mockImplementation((coords) => coords);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should subscribe to userPositions$ and call setupMap when userPositions is non-empty', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserMarkers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        userPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock
      );
      component.ngAfterViewInit();
      userPositionServiceMock.userPositions$.next([{ lat: 1, lon: 2 }]);
      expect(markersMock.setupMap).toHaveBeenCalledWith(
        [{ lat: 1, lon: 2 }],
        viewMock
      );
    });
  });

  it('should not call setupMap when userPositions is empty', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserMarkers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        userPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock
      );
      component.ngAfterViewInit();
      userPositionServiceMock.userPositions$.next([]);
      expect(markersMock.setupMap).not.toHaveBeenCalled();
    });
  });

  it('should process dataStore$ with location and call updateUserPosition and storePicture', () => {
    const data = [
      {
        longitude: '5',
        latitude: '6',
        postcode: '12345',
        city: 'Test City',
        housenumber: 123,
        firstName: 'John',
        userPositionInfo: 'info',
        'img.jpg': 'this is a blob',
      },
    ];

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserMarkers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        userPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock
      );
      component.ngAfterViewInit();
      dataStoreServiceMock.dataStore$.next(data);

      expect(userPositionServiceMock.updateUserPosition).toHaveBeenCalledWith(
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
      expect(viewMock.animate).toHaveBeenCalled();
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

    userPositionServiceMock.getUserByAddress.mockReturnValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserMarkers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        userPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock
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

    userPositionServiceMock.getUserByAddress.mockReturnValue(undefined);
    requestLocationSpy.mockImplementation(() => {
      throw new Error('fail');
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserMarkers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        userPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock
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

  it('should update userPosition if getUserByAddress returns a user', () => {
    const data = [
      {
        notLongitude: 'x',
        notLatitude: 'y',
        postcode: '12345',
        city: 'Test City',
        housenumber: 123,
      },
    ];

    userPositionServiceMock.getUserByAddress.mockReturnValue({
      userName: 'Jane',
      userPositionInfo: 'info',
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserMarkers,
          useValue: markersMock,
        },
      ],
    });
    TestBed.runInInjectionContext((): void => {
      // Create component
      const component = createComponent(
        userPositionServiceMock,
        dataStoreServiceMock,
        pictureStoreMock,
        markersMock,
        toasterMock,
        mapMock
      );
      component.ngAfterViewInit();
      dataStoreServiceMock.dataStore$.next(data);

      expect(userPositionServiceMock.updateUserPosition).toHaveBeenCalledWith(
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
    userPositionServiceMock.userPositions$.pipe = jest.fn().mockReturnValue({
      subscribe: jest.fn().mockReturnValue({ unsubscribe: unsubscribe1 }),
    });
    dataStoreServiceMock.dataStore$.pipe = jest.fn().mockReturnValue({
      subscribe: jest.fn().mockReturnValue({ unsubscribe: unsubscribe2 }),
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserMarkers,
          useValue: markersMock,
        },
      ],
    });
    await TestBed.configureTestingModule({
      imports: [HousesMapComponent],
      providers: [
        { provide: DestroyRef, useValue: destroyRefMock }, // Mock the DestroyRef
        {
          provide: UserPositionService, // Mock the UserPositionService
          useValue: userPositionServiceMock,
        },
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
