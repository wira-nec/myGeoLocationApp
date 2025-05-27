import { Injectable } from '@angular/core';
import { GeoPosition } from '../app/view-models/geoPosition';
import { BehaviorSubject } from 'rxjs';
import { isEqual } from 'lodash';
import { Coordinate } from 'ol/coordinate';
import { getAddress, StoreData } from './data-store.service';
import { v4 as uuidv4 } from 'uuid';

interface IdMapper {
  id: string;
  uid: string;
}

@Injectable({
  providedIn: 'root',
})
export class GeoPositionService {
  private geoPositions: GeoPosition[] = [];
  private mapIdToUuid: IdMapper[] = [];
  removedGeoPosition$ = new BehaviorSubject<GeoPosition | null>(null);
  geoPositions$ = new BehaviorSubject<GeoPosition[]>([]);

  public getNumberOfGeoPositions() {
    return this.geoPositions.length;
  }

  public setGeoPositionIdUid(id: string, olUid: string) {
    const idMap = this.mapIdToUuid.find((map) => map.id === id);
    if (idMap) {
      idMap.uid = olUid;
    } else {
      this.mapIdToUuid.push({ id, uid: olUid });
    }
  }

  public getGeoPositionByAddress(
    city: string,
    postcode: string,
    houseNumber: string,
    street?: string
  ): GeoPosition | undefined {
    return this.geoPositions.find((geoPos) => {
      const positionInfo = JSON.parse(geoPos.geoPositionInfo);
      const houseNumber = positionInfo.housenumber.split('-').at(-1) as string;
      let addressFound =
        positionInfo.city.toLowerCase() === city.toLowerCase() &&
        positionInfo.postcode.replaceAll(' ', '').toLowerCase() ===
          postcode.replaceAll(' ', '').toLowerCase() &&
        houseNumber.toLowerCase() === houseNumber.toLowerCase();
      // Sometimes open street map returns the correct address on a wrong postcode, so verify for street as well
      if (!addressFound && street) {
        addressFound =
          positionInfo.street.toLowerCase() === street.toLowerCase() &&
          positionInfo.city.toLowerCase() === city.toLowerCase() &&
          positionInfo.street.toLowerCase() === street.toLowerCase() &&
          houseNumber.toLowerCase() === houseNumber.toLowerCase();
      }
      return addressFound;
    });
  }

  public findNearestByAddress(
    city: string,
    postcode: string,
    houseNumber: string,
    street?: string
  ): GeoPosition | undefined {
    // Find the nearest geo position by address
    return this.geoPositions.find((geoPos) => {
      // Regex to get house number till first non-digit character
      // e.g. 123-456 => 123
      // e.g. 123 => 123
      // e.g. 123a => 123
      const regex = new RegExp(`^\\d+`);
      const positionInfo = JSON.parse(geoPos.geoPositionInfo);
      // When no street given, check if the geo position matches the postcode, city, and closest house number
      if (
        !street &&
        positionInfo.city.toLowerCase() === city.toLowerCase() &&
        positionInfo.postcode.replaceAll(' ', '').toLowerCase() ===
          postcode.replaceAll(' ', '').toLowerCase() &&
        positionInfo.housenumber.toLowerCase().match(regex)?.[0] ===
          houseNumber.toLowerCase().match(regex)?.[0]
      ) {
        return true;
      }
      // Else check if the geo position matches the street, city, and closest house number
      if (
        positionInfo.street.toLowerCase() === street?.toLowerCase() &&
        positionInfo.city.toLowerCase() === city.toLowerCase() &&
        // compare house number with regex
        positionInfo.housenumber.toLowerCase().match(regex)?.[0] ===
          houseNumber.toLowerCase().match(regex)?.[0]
      ) {
        return true;
      }
      return false;
    });
  }

  public getIdByUid(uid: string): string | undefined {
    return this.mapIdToUuid.find((map) => map.uid === uid)?.id;
  }

  public hasGeoPositions() {
    return !!this.geoPositions.length;
  }

  public clearGeoPositions() {
    this.geoPositions.forEach((geoPos) => this.removeGeoPosition(geoPos.id));
  }

  public addGeoPositions(geoPosition: GeoPosition[]) {
    geoPosition.forEach((geoPos) => {
      this.geoPositions.push(geoPos);
    });
    this.geoPositions$.next(geoPosition);
  }

  public updateGeoPosition(
    longitude: number,
    latitude: number,
    userName = 'Unknown',
    storeData: StoreData | undefined,
    geoPositionInfo: string
  ) {
    const position: GeoPosition = {
      coords: {
        altitude: 0,
        longitude,
        accuracy: 0,
        altitudeAccuracy: null,
        heading: null,
        latitude,
        speed: null,
        toJSON: function () {
          throw new Error('Function not implemented.');
        },
      },
      id: uuidv4(),
      userName,
      geoPositionInfo,
      zoom: 0,
      details: storeData,
    };
    if (storeData) {
      const [postcode, city, houseNumber, street] = getAddress(storeData);
      const geoPos = this.getGeoPositionByAddress(
        city,
        postcode,
        houseNumber,
        street
      );
      if (geoPos) {
        geoPos.details = storeData;
        geoPos.coords = {
          ...geoPos.coords,
          longitude: longitude || geoPos.coords.longitude,
          latitude: latitude || geoPos.coords.latitude,
        };
        geoPos.geoPositionInfo = geoPositionInfo;
        return;
      }
    }
    this.geoPositions.push(position);
    this.geoPositions$.next([position]);
  }

  public setGeoCoordinatesAndOrZoom(
    id: string,
    coords: GeolocationCoordinates,
    zoom?: number
  ) {
    const geoPos = this.getGeoPosition(id);
    if (geoPos && (!isEqual(geoPos.coords, coords) || geoPos.zoom !== zoom)) {
      geoPos.coords = coords;
      if (zoom) {
        geoPos.zoom = zoom;
      }
      this.geoPositions$.next([geoPos]);
    }
  }

  public getGeoPosition(id: string): GeoPosition | undefined {
    const geoPos = this.geoPositions.find((geoPos) => geoPos.id === id);
    if (geoPos) {
      return geoPos;
    }
    return undefined;
  }

  public getGeoPositions(): GeoPosition[] {
    return this.geoPositions;
  }

  public getGeoPositionByCoordinates(
    coordinates: Coordinate
  ): GeoPosition | undefined {
    return this.geoPositions.find(
      (geoPos) =>
        geoPos.coords.altitude === coordinates[1] &&
        geoPos.coords.longitude === coordinates[0]
    );
  }

  public removeGeoPosition(id: string): GeoPosition | undefined {
    const geoPosIndex = this.geoPositions.findIndex(
      (geoPos) => geoPos.id === id
    );
    if (geoPosIndex >= 0) {
      const geoPos = this.geoPositions.splice(geoPosIndex, 1)[0];
      this.removedGeoPosition$.next(geoPos);
      return geoPos;
    }
    return undefined;
  }
}
