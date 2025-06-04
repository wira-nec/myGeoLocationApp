import { BehaviorSubject, Subject } from 'rxjs';
import { StoreData } from '../app/core/services/data-store.service';
import * as geocoderCreator from '../app/routes/houses/helpers/geocoderCreator';
import { PictureStore } from '../app/core/services/load-picture.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function setUpMockedServices() {
  const geoPositionServiceMock = {
    geoPositions$: new Subject<any[]>(),
    updateGeoPosition: jest.fn(),
    getGeoPositionByAddress: jest.fn(),
  };

  const dataStoreServiceMock = {
    dataStore$: new Subject<StoreData[]>(),
    getAddress: ['street', 'housenumber', 'city', 'postcode'],
    imagesFilter: (col: string) => col.startsWith('img'),
    store: jest.fn(),
  };

  const progressServiceMock = {
    progress$: new Subject<number>(),
    setProgress: jest.fn(),
    setMaxCount: jest.fn(),
    increaseProgressByStep: jest.fn(),
  };

  const pictureStoreMock = {
    storePicture: jest.fn(),
    pictureStore$: new BehaviorSubject<PictureStore>({}),
    getPicture: jest.fn(),
  };

  const markersMock = {
    setupMap: jest.fn(),
    initializeMarkers: jest.fn(),
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

  const excelServiceMock = {
    generateExcel: jest.fn(),
    importExcelFile: jest
      .fn()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .mockImplementation((e: ArrayBuffer, _: StoreData[]) =>
        Array.from(new TextDecoder().decode(e))
      ),
  };

  // Patch requestLocation
  const requestLocationSpy = jest
    .spyOn(geocoderCreator, 'requestLocation')
    .mockImplementation(() => jest.fn);

  return {
    geoPositionServiceMock,
    dataStoreServiceMock,
    pictureStoreMock,
    markersMock,
    toasterMock,
    viewMock,
    mapMock,
    requestLocationSpy,
    progressServiceMock,
    excelServiceMock,
  };
}
