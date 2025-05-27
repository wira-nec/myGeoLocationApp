import Map from 'ol/Map';
import olGeocoder from 'ol-geocoder';
import {
  DataStoreService,
  FIRST_NAME,
  getAddress,
  StoreData,
} from '../../services/data-store.service';
import { UserPositionService } from '../../services/user-position.service';
import { fromLonLat } from 'ol/proj';
import { ToasterService } from '../../services/toaster.service';
import { ProgressService } from '../../services/progress.service';
import { PROGRESS_ID } from '../houses/bottom-file-selection-sheet/bottom-file-selection-sheet.component';

// Minimal FeatureCollection type for GeoJSON features
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

let isGeocodeHandlingFinished: boolean | undefined = undefined;

export function geocoderCreator(
  map: Map,
  zoomLevelSingleMarker: number,
  dataStoreService: DataStoreService,
  userPositionService: UserPositionService,
  toaster: ToasterService,
  progressService: ProgressService
) {
  const outstandingRequests: string[] = [];
  const responses: Record<string, FeatureCollection[]> = {};

  /**
   * Custom provider for OS OpenNames search covering Great Britian.
   * Factory function which returns an object with the methods getParameters
   * and handleResponse called by the Geocoder
   */
  function OsOpenNamesSearch(options: { url: string }) {
    const { url } = options;

    return {
      /**
       * Get the url, query string parameters and optional JSONP callback
       * name to be used to perform a search.
       * @param {object} opt Options object with query, key, lang, country codes and limit properties.
       * @return {object} Parameters for search request
       */
      getParameters(opt: { query: string; limit?: number; lang?: string }) {
        console.log('OsOpenNamesSearch.getParameters', opt);
        outstandingRequests.push(opt.query);
        return {
          url,
          // The API endpoint for Photon
          params: {
            q: opt.query,
            limit: opt.limit || 1,
            lang: 'en',
          },
        };
      },

      /**
       * Given the results of performing a search return an array of results
       * @param {object} results returned following a search request
       * @return {Array} Array of search results
       */
      handleResponse(results: { features: FeatureCollection[] }) {
        // The API returns a GeoJSON FeatureCollection
        const query = outstandingRequests.shift() || 'error';
        responses[query] = results.features;
        console.log('OsOpenNamesSearch.handleResponse', results, query);
        if (results && results.features && results.features.length !== 0) {
          return results.features.map((e) => ({
            lon: e.geometry.coordinates[0],
            lat: e.geometry.coordinates[1],
            address: {
              name: e.properties.name,
              postcode: e.properties.postcode,
              city: e.properties.city,
              state: e.properties.state,
              country: e.properties.country,
            },
            original: {
              formatted: e.properties.name,
              details: {
                ...e.properties,
                ['query']: query, // include the original query for reference
              },
            },
          }));
        }
        const errorMessage = `No results found for "${query}", please check your excel sheet`;
        toaster.show('error', errorMessage, [], 300000);
        progressService.increaseProgressByStep(PROGRESS_ID);
        return [];
      },
    };
  }

  // Create an instance of the custom provider that wraps the 'photon' provider, passing any options that are
  // required
  // This is done to handle the response of the request in case of errors
  const provider = OsOpenNamesSearch({
    url: 'https://photon.komoot.io/api/',
  });

  const geocoder = new olGeocoder('nominatim', {
    provider: provider, //'photon',
    placeholder: 'Search for ...',
    targetType: 'text-input',
    limit: 1,
    keepOpen: true,
    target: document.body,
    preventDefault: true,
    debug: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geocoder.on('addresschosen', (evt: any) => {
    const originalDetails = evt.address.original.details;
    // try to get it by postcode, city and house number
    const [storeData, errorMessage] =
      dataStoreService.findByApproach(originalDetails);
    if (errorMessage) {
      toaster.show('warning', errorMessage, [], 300000);
    }
    userPositionService.updateUserPosition(
      evt.place.lon,
      evt.place.lat,
      storeData ? storeData[FIRST_NAME] : undefined,
      storeData,
      JSON.stringify(originalDetails)
    );
    progressService.increaseProgressByStep(PROGRESS_ID);
    console.log('responses', responses);
    // do only once a position view animation on first time last received address
    if (isGeocodeHandlingFinished) {
      console.log('isGeocodeHandlingFinished', isGeocodeHandlingFinished);
      map.getView().animate({
        center: fromLonLat([evt.place.lon, evt.place.lat]),
        zoom: zoomLevelSingleMarker,
      });
      isGeocodeHandlingFinished = false;
    }
  });
  return geocoder;
}

export function geocodeHandlingFinished() {
  if (isGeocodeHandlingFinished === undefined) {
    isGeocodeHandlingFinished = true;
  }
}

export function requestLocation(data: StoreData) {
  const textInput = document.querySelector(
    '.gcd-txt-input'
  ) as HTMLInputElement;
  const sendTextInput = document.querySelector(
    '.gcd-txt-search'
  ) as HTMLButtonElement;
  if (textInput && sendTextInput) {
    const [postcode, city, houseNumber, street] = getAddress(data);
    textInput.value = `${postcode}, ${street ?? ''} ${houseNumber}, ${city}`;
    console.log('search street map for', textInput.value);
    sendTextInput.click();
  }
}
