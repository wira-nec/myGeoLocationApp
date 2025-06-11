import { Injectable } from '@angular/core';
import {
  ProgressService,
  XSL_IMPORT_PROGRESS_ID,
} from '../services/progress.service';
import { ToasterService } from '../services/toaster.service';

const URL = 'https://photon.komoot.io/api/';

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
    housenumber?: string;
    street?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export function photonProviderFactory(
  toaster: ToasterService,
  progressService: ProgressService
) {
  return new PhotonProvider(toaster, progressService);
}

@Injectable({
  providedIn: 'root',
})
export class PhotonProvider {
  responses: Record<string, FeatureCollection[]> = {};
  outstandingRequests: string[] = [];

  constructor(
    private readonly toaster: ToasterService,
    private readonly progressService: ProgressService
  ) {}
  /**
   * Get the url, query string parameters and optional JSONP callback
   * name to be used to perform a search.
   * @param {object} opt Options object with query, key, lang, country codes and limit properties.
   * @return {object} Parameters for search request
   */
  getParameters(opt: { query: string; limit?: number; lang?: string }): object {
    console.log('OsOpenNamesSearch.getParameters', opt);
    this.outstandingRequests.push(opt.query);
    return {
      url: URL,
      // The API endpoint for Photon
      params: {
        q: opt.query,
        limit: opt.limit || 1,
        lang: 'en',
      },
    };
  }

  /**
   * Given the results of performing a search return an array of results
   * @param {object} results returned following a search request
   * @return {Array} Array of search results
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleResponse(results: { features: FeatureCollection[] }): any[] {
    // The API returns a GeoJSON FeatureCollection
    const query = this.outstandingRequests.shift() || 'error';
    this.responses[query] = results.features;
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
          road: e.properties.street,
          house_number: e.properties.housenumber,
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
    const errorMessage = `No address found for "${query}", please verify address in your excel sheet`;
    this.toaster.show('error', errorMessage, [], 300000);
    // Fire and forget, because handle response marked as async will not work.
    this.progressService.increaseProgressByStep(XSL_IMPORT_PROGRESS_ID);
    return [];
  }
}
