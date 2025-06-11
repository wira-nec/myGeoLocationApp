import { Injectable } from '@angular/core';
import {
  DataStoreService,
  FIRST_NAME,
  getAddress,
  StoreData,
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
  map!: Map;
  zoomLevelSingleMarker!: number;
  responses: Record<string, FeatureCollection[]> = {};

  isGeocodeHandlingFinished: boolean | undefined = undefined;
  geoCoder!: typeof olGeocoder;
  photonProvider: PhotonProvider;

  addressChosen: unknown;
  switchToSearchAddress = false;

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly geoPositionService: GeoPositionService,
    private readonly toaster: ToasterService,
    private readonly progressService: ProgressService,
    private readonly markers: Markers
  ) {
    this.photonProvider = photonProviderFactory(toaster, progressService);
  }

  geocoderCreator(map: Map, zoomLevelSingleMarker: number) {
    this.map = map;
    this.zoomLevelSingleMarker = zoomLevelSingleMarker;
    this.addressChosen = this.handleAddressChosen(
      this.responses,
      this.map,
      this.zoomLevelSingleMarker
    );
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
    this.geoCoder.on(ADDRESS_CHOSEN, this.addressChosen);
    return this.geoCoder;
  }

  handleAddressChosen(
    responses: Record<string, FeatureCollection[]>,
    map: Map,
    zoomLevelSingleMarker: number
  ): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (evt: any) => {
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
      await this.progressService.increaseProgressByStep(XSL_IMPORT_PROGRESS_ID);
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
    };
  }

  searchAddressChosen(): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (evt: any) => {
      const { postcode, street, housenumber, city } =
        evt.address.original.details;
      this.markers.addMarker(
        SEARCH_FOR_MARKER_ID,
        [evt.place.lon, evt.place.lat],
        `${
          street?.length ? street + ' ' : ''
        }${housenumber} ${city}, ${postcode}`
      );
      this.map.getView().animate({
        center: fromLonLat([evt.place.lon, evt.place.lat]),
        zoom: 15,
      });
    };
  }

  switchAddressChosenHandler(switchToSearchAddress: boolean) {
    this.switchToSearchAddress = switchToSearchAddress;
    if (switchToSearchAddress) {
      this.geoCoder.un(ADDRESS_CHOSEN, this.addressChosen);
      this.geoCoder.on(ADDRESS_CHOSEN, this.searchAddressChosen());
      this.geoCoder.options.limit = 5;
    } else {
      this.geoCoder.un(ADDRESS_CHOSEN, this.searchAddressChosen());
      this.geoCoder.on(ADDRESS_CHOSEN, this.addressChosen);
      this.geoCoder.options.limit = 1;
    }
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
