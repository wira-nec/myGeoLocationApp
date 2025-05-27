import { BehaviorSubject, Subject } from 'rxjs';
import { StoreData } from '../services/data-store.service';
import * as geocoderCreator from '../app/helpers/geocoderCreator';
import { PictureStore } from '../services/load-picture.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function setUpMockedServices() {
  const userPositionServiceMock = {
    userPositions$: new Subject<any[]>(),
    updateUserPosition: jest.fn(),
    getUserByAddress: jest.fn(),
  };

  const dataStoreServiceMock = {
    dataStore$: new Subject<StoreData[]>(),
    getAddress: ['postcode', 'city', 'housenumber'],
    imagesFilter: (col: string) => col.startsWith('img'),
    store: jest.fn(),
  };

  const progressServiceMock = {
    progress$: new Subject<number>(),
    setProgress: jest.fn(),
  };

  const pictureStoreMock = {
    storePicture: jest.fn(),
    pictureStore$: new BehaviorSubject<PictureStore>({}),
    getPicture: jest.fn(),
  };

  const markersMock = {
    setupMap: jest.fn(),
    initializeUseMarkers: jest.fn(),
    zoomLevelSingleMarker: 10,
  };

  const toasterMock = {
    show: jest.fn(),
  };

  const viewMock = {
    animate: jest.fn(),
  };

  const mapMock = {
    getView: jest.fn(() => viewMock),
    getTargetElement: jest.fn(() => ({
      classList: { add: jest.fn(), remove: jest.fn() },
    })),
    on: jest.fn(),
    addControl: jest.fn(),
  };

  // Patch requestLocation
  const requestLocationSpy = jest
    .spyOn(geocoderCreator, 'requestLocation')
    .mockImplementation(() => jest.fn);

  return {
    userPositionServiceMock,
    dataStoreServiceMock,
    pictureStoreMock,
    markersMock,
    toasterMock,
    viewMock,
    mapMock,
    requestLocationSpy,
    progressServiceMock,
  };
}
