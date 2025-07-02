import { inject, Injectable } from '@angular/core';
import {
  CITY,
  DataStoreService,
  FIRST_NAME,
  getAddress,
  HOUSE_NUMBER,
  StoreData,
  STREET,
} from './data-store.service';
import { GeoPositionService } from './geo-position.service';
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

export const ADDRESS_CHOSEN = 'addresschosen';

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

  isGeocodeHandlingFinished: boolean | undefined = undefined;
  geoCoder!: typeof olGeocoder;
  photonProvider: PhotonProvider;

  defaultAddressHandler: unknown;
  activeAddressHandler: unknown;
  searchInputService = inject(SearchInputService);

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly geoPositionService: GeoPositionService,
    private readonly toaster: ToasterService,
    private readonly progressService: ProgressService,
    private readonly markers: Markers
  ) {
    this.photonProvider = photonProviderFactory();
    this.keyboardInput$.subscribe(() =>
      this.switchAddressChosenHandler(this.searchInputService.getVisibility())
    );
  }

  geocoderCreator(map: Map, zoomLevelSingleMarker: number) {
    this.map = map;
    this.zoomLevelSingleMarker = zoomLevelSingleMarker;
    this.defaultAddressHandler = this.handleAddressChosen(
      this.responses,
      this.map,
      this.zoomLevelSingleMarker
    );
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

  handleAddressChosen(
    responses: Record<string, FeatureCollection[]>,
    map: Map,
    zoomLevelSingleMarker: number
  ): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (evt: any) => {
      if (evt.address.original.details.error) {
        this.toaster.show(
          'error',
          evt.address.original.details.error,
          [],
          300000
        );
        await this.progressService.increaseProgressByStep(
          XSL_IMPORT_PROGRESS_ID
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
        this.geoPositionService.updateGeoPosition(
          evt.place.lon,
          evt.place.lat,
          storeData ? storeData[FIRST_NAME] : undefined,
          storeData,
          JSON.stringify({ postcode, street, housenumber, city, query })
        );
        await this.progressService.increaseProgressByStep(
          XSL_IMPORT_PROGRESS_ID
        );
        console.log('responses', responses);
        // do only once a position view animation on first time last received address
        if (this.isGeocodeHandlingFinished) {
          console.log(
            'isGeocodeHandlingFinished',
            this.isGeocodeHandlingFinished
          );
          map.getView().animate({
            center: fromLonLat([5.4808, 52.2211]),
            zoom: zoomLevelSingleMarker,
          });
          this.isGeocodeHandlingFinished = false;
        }
      }
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
        if (
          !this.dataStoreService.get({
            [STREET]: street,
            [HOUSE_NUMBER]: housenumber,
            [CITY]: city,
          }) &&
          !this.dataStoreService.getByAddr(`${street} ${housenumber} ${city}`)
        ) {
          this.markers.addMarker(
            SEARCH_FOR_MARKER_ID,
            [evt.place.lon, evt.place.lat],
            `${
              street?.length ? street + ' ' : ''
            }${housenumber} ${city}, ${postcode}`
          );
        }
        this.map.getView().animate({
          center: fromLonLat([evt.place.lon, evt.place.lat]),
          zoom: 15,
        });
      }
    };
  }

  switchAddressChosenHandler(switchToSearchAddress: boolean) {
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

  geocodeHandlingFinished() {
    if (this.isGeocodeHandlingFinished === undefined) {
      this.isGeocodeHandlingFinished = true;
    }
  }

  requestLocation(data: StoreData) {
    const textInput = document.querySelector(
      '.gcd-txt-input'
    ) as HTMLInputElement;
    const sendTextInput = document.querySelector(
      '.gcd-txt-search'
    ) as HTMLButtonElement;
    if (textInput && sendTextInput) {
      const [street, houseNumber, city, postcode] = getAddress(data);
      textInput.value = `${street ?? ''} ${houseNumber}, ${city}, ${postcode}`
        .replaceAll(',,', ',')
        .replaceAll('  ', ' ');
      console.log('search street map for', textInput.value);
      sendTextInput.click();
    }
  }
}
