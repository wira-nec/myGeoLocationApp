import { inject, Injectable } from '@angular/core';
import {
  CITY,
  DataStoreService,
  GEO_INFO,
  getAddress,
  HOUSE_NUMBER,
  StoreData,
  STREET,
  UNIQUE_ID,
} from './data-store.service';
import { ProgressService, XSL_IMPORT_PROGRESS_ID } from './progress.service';
import { ToasterService } from './toaster.service';
import { Map } from 'ol';
import olGeocoder from 'ol-geocoder';
import { fromLonLat } from 'ol/proj';
import {
  PhotonProvider,
  photonProviderFactory,
} from '../providers/photon-provider';
import {
  Markers,
  SEARCH_FOR_MARKER_ID,
} from '../../routes/houses/providers/markers';
import { SearchInputService } from './search-input.service';
import { filter, fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Coordinate } from 'ol/coordinate';
import { getAddress as getFullAddress } from '../../core/helpers/dataManipulations';
import { BinarySemaphoreService } from './binary-semaphore.service';

interface FeatureCollection {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    name?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

type ProgressCallbackFunction = () => Promise<void> | undefined;

export const ADDRESS_CHOSEN = 'addresschosen';
export const NIJKERK_COORDINATES = [5.4808, 52.2211] as Coordinate;

@Injectable({
  providedIn: 'root',
})
export class GeoCoderService {
  keyboardInput$ = fromEvent(window, 'click').pipe(
    filter((event) => event.target instanceof HTMLImageElement),
    takeUntilDestroyed()
  );
  map!: Map;
  zoomLevelSingleMarker!: number;
  responses: Record<string, FeatureCollection[]> = {};

  geoCoder!: typeof olGeocoder;
  photonProvider: PhotonProvider;

  defaultAddressHandler: unknown;
  activeAddressHandler: unknown;
  searchInputService = inject(SearchInputService);
  progressCallback!: ProgressCallbackFunction;

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly toaster: ToasterService,
    private readonly progressService: ProgressService,
    private readonly markers: Markers,
    private readonly semaphore: BinarySemaphoreService
  ) {
    this.photonProvider = photonProviderFactory();
    this.keyboardInput$.subscribe(() =>
      this.switchAddressChosenHandler(this.searchInputService.getVisibility())
    );
    console.log('GeoCoderService initialized');
  }

  geocoderCreator(map: Map, zoomLevelSingleMarker: number) {
    this.map = map;
    this.zoomLevelSingleMarker = zoomLevelSingleMarker;
    this.defaultAddressHandler = this.handleAddressChosen(this.responses);
    this.activeAddressHandler = this.defaultAddressHandler;
    this.geoCoder = new olGeocoder('nominatim', {
      provider: this.photonProvider, //'photon',
      placeholder: 'Search for ...',
      targetType: 'text-input',
      limit: 1,
      keepOpen: true,
      target: document.body,
      preventDefault: true,
      debug: true,
    });
    this.geoCoder.on(ADDRESS_CHOSEN, this.activeAddressHandler);
    return this.geoCoder;
  }

  setProgressCallback(callback: ProgressCallbackFunction) {
    this.progressCallback = callback;
  }

  handleAddressChosen(responses: Record<string, FeatureCollection[]>): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (evt: any) => {
      if (evt.address.original.details.error) {
        this.toaster.show(
          'error',
          evt.address.original.details.error,
          [],
          300000
        );
      } else {
        const { postcode, street, housenumber, city, query } =
          evt.address.original.details;
        // try to get storedData by postcode or street and house number, city
        const [storeData, errorMessage] = this.dataStoreService.findByApproach(
          postcode,
          housenumber,
          street,
          city,
          query
        );
        if (errorMessage) {
          this.toaster.show('warning', errorMessage, [], 0);
        }
        if (storeData) {
          this.dataStoreService.updateGeoPosition(
            storeData[UNIQUE_ID],
            evt.place.lon,
            evt.place.lat,
            JSON.stringify({ postcode, street, housenumber, city, query })
          );
          this.markers.setupMap(
            storeData[UNIQUE_ID],
            evt.place.lon,
            evt.place.lat,
            getFullAddress(storeData),
            storeData[GEO_INFO],
            this.map.getView()
          );
        }
        console.log('responses', responses);
      }
      if (this.progressCallback !== undefined) {
        await this.progressCallback();
      }
      this.semaphore.release();
    };
  }

  searchAddressChosen(): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (evt: any) => {
      if (evt.address.original.details.error) {
        this.toaster.show(
          'error',
          `No address found for "${evt.address.original.details.query}", please enter another address`,
          [],
          300000
        );
        await this.progressService.increaseProgressByStep(
          XSL_IMPORT_PROGRESS_ID
        );
      } else {
        const { postcode, street, housenumber, city } =
          evt.address.original.details;
        const coords = [evt.place.lon, evt.place.lat];
        const storeData =
          this.dataStoreService.getByAddr(`${street} ${housenumber} ${city}`) ||
          this.dataStoreService.get({
            [STREET]: street,
            [HOUSE_NUMBER]: housenumber,
            [CITY]: city,
          });
        if (!storeData) {
          this.markers.addMarker(
            SEARCH_FOR_MARKER_ID,
            coords,
            `${
              street?.length ? street + ' ' : ''
            }${housenumber} ${city}, ${postcode}`
          );
          this.zoomInOnCoordinates(coords, 16, () =>
            this.markers.flash(SEARCH_FOR_MARKER_ID)
          );
        } else {
          this.zoomInOnCoordinates(coords, 16, () =>
            this.markers.flash(storeData[UNIQUE_ID])
          );
        }
      }
    };
  }

  showLoadingSpinner(show: boolean) {
    if (show) {
      this.map.getTargetElement().classList.add('spinner');
    } else {
      this.map.getTargetElement().classList.remove('spinner');
    }
  }

  delayedZoomInOnCoordinates(coords: Coordinate) {
    setTimeout(() => {
      this.map.getView().animate({
        center: fromLonLat(coords),
        zoom: this.markers.zoomLevelSingleMarker,
      });
    }, 1000);
  }

  zoomInOnCoordinates(
    coords: Coordinate,
    zoom = 15,
    callback?: (arg0: boolean) => void
  ) {
    if (callback !== undefined) {
      this.map.getView().animate(
        {
          center: fromLonLat(coords),
          zoom,
        },
        callback
      );
    } else {
      this.map.getView().animate({
        center: fromLonLat(coords),
        zoom,
      });
    }
  }

  getView() {
    return this.map.getView();
  }

  switchAddressChosenHandler(switchToSearchAddress: boolean) {
    if (!this.geoCoder) {
      return;
    }
    this.geoCoder.un(ADDRESS_CHOSEN, this.activeAddressHandler);
    if (switchToSearchAddress) {
      this.activeAddressHandler = this.searchAddressChosen();
      this.geoCoder.options.limit = 5;
    } else {
      this.activeAddressHandler = this.defaultAddressHandler;
      this.geoCoder.options.limit = 1;
    }
    this.geoCoder.on(ADDRESS_CHOSEN, this.activeAddressHandler);
  }

  async requestLocationAsync(data: StoreData) {
    const node = document.querySelector('.gcd-txt-result');
    const textInput = document.querySelector(
      '.gcd-txt-input'
    ) as HTMLInputElement;
    const sendTextInput = document.querySelector(
      '.gcd-txt-search'
    ) as HTMLButtonElement;
    if (node && textInput && sendTextInput) {
      try {
        const observer = this.observeSearchInputForErrors(textInput);

        const [street, houseNumber, city, postcode] = getAddress(data);
        textInput.value = `${street ?? ''} ${houseNumber}, ${city}, ${postcode}`
          .replaceAll(',,', ',')
          .replaceAll('  ', ' ');
        console.log('search street map for', textInput.value);
        await this.semaphore.acquire();
        sendTextInput.click();
        observer.disconnect();
      } catch (e) {
        this.searchForErrorHandler((e as Error).message);
      }
      return;
    }
  }
  private observeSearchInputForErrors(textInput: HTMLInputElement) {
    const searchForText = textInput.value;
    const node = document.querySelector('.gcd-txt-result');
    if (node) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(async (mutation) => {
          if (mutation.target.textContent?.startsWith('Error')) {
            await this.searchForErrorHandler(
              `${mutation.target.textContent}, while searching for "${searchForText}". Refresh page and start over!`
            );
          }
        });
      });

      observer.observe(node, {
        attributes: true,
        childList: true,
        characterData: true,
      });
      return observer;
    }
    throw new Error('Something went wrong, please refresh page!');
  }

  private async searchForErrorHandler(errorMessage: string) {
    this.toaster.show('error', errorMessage, [], 300000);
    await this.progressService.increaseProgressByStep(XSL_IMPORT_PROGRESS_ID);
    this.semaphore.release();
  }
}
