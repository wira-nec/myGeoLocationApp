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
export class UserPositionService {
  private userPositions: GeoPosition[] = [];
  private mapIdToUuid: IdMapper[] = [];
  removedUserPosition$ = new BehaviorSubject<GeoPosition | null>(null);
  userPositions$ = new BehaviorSubject<GeoPosition[]>([]);

  public getNumberOfUsers() {
    return this.userPositions.length;
  }

  public setUserIdUid(id: string, olUid: string) {
    const idMap = this.mapIdToUuid.find((map) => map.id === id);
    if (idMap) {
      idMap.uid = olUid;
    } else {
      this.mapIdToUuid.push({ id, uid: olUid });
    }
  }

  public getUserByAddress(
    city: string,
    postcode: string,
    houseNumber: string,
    street?: string
  ): GeoPosition | undefined {
    return this.userPositions.find((userPos) => {
      const userInfo = JSON.parse(userPos.userPositionInfo);
      const userHouseNumber = userInfo.housenumber.split('-').at(-1) as string;
      let addressFound =
        userInfo.city.toLowerCase() === city.toLowerCase() &&
        userInfo.postcode.replaceAll(' ', '').toLowerCase() ===
          postcode.replaceAll(' ', '').toLowerCase() &&
        userHouseNumber.toLowerCase() === houseNumber.toLowerCase();
      // Sometimes open street map returns the correct address on a wrong postcode, so check for street as well
      if (!addressFound && street) {
        addressFound =
          userInfo.street.toLowerCase() === street.toLowerCase() &&
          userInfo.city.toLowerCase() === city.toLowerCase() &&
          userInfo.street.toLowerCase() === street.toLowerCase() &&
          userHouseNumber.toLowerCase() === houseNumber.toLowerCase();
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
    // Find the nearest user position by address
    return this.userPositions.find((userPos) => {
      // Regex to get house number till first non-digit character
      // e.g. 123-456 => 123
      // e.g. 123 => 123
      // e.g. 123a => 123
      const regex = new RegExp(`^\\d+`);
      const userInfo = JSON.parse(userPos.userPositionInfo);
      // When no street given, check if the user position matches the postcode, city, and closest house number
      if (
        !street &&
        userInfo.city.toLowerCase() === city.toLowerCase() &&
        userInfo.postcode.replaceAll(' ', '').toLowerCase() ===
          postcode.replaceAll(' ', '').toLowerCase() &&
        userInfo.housenumber.toLowerCase().match(regex)?.[0] ===
          houseNumber.toLowerCase().match(regex)?.[0]
      ) {
        return true;
      }
      // Else check if the user position matches the street, city, and closest house number
      if (
        userInfo.street.toLowerCase() === street?.toLowerCase() &&
        userInfo.city.toLowerCase() === city.toLowerCase() &&
        // compare house number with regex
        userInfo.housenumber.toLowerCase().match(regex)?.[0] ===
          houseNumber.toLowerCase().match(regex)?.[0]
      ) {
        return true;
      }
      return false;
    });
  }

  public getUserIdByUid(uid: string): string | undefined {
    return this.mapIdToUuid.find((map) => map.uid === uid)?.id;
  }

  public hasUserPositions() {
    return !!this.userPositions.length;
  }

  public clearUserPositions() {
    this.userPositions.forEach((userPos) =>
      this.removeUserPosition(userPos.id)
    );
  }

  public addUserPositions(geoPosition: GeoPosition[]) {
    geoPosition.forEach((geoPos) => {
      this.userPositions.push(geoPos);
    });
    this.userPositions$.next(geoPosition);
  }

  public updateUserPosition(
    longitude: number,
    latitude: number,
    userName = 'Unknown',
    storeData: StoreData | undefined,
    userPositionInfo: string
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
      userPositionInfo,
      zoom: 0,
      details: storeData,
    };
    if (storeData) {
      const [postcode, city, houseNumber, street] = getAddress(storeData);
      const userPos = this.getUserByAddress(
        city,
        postcode,
        houseNumber,
        street
      );
      if (userPos) {
        userPos.details = storeData;
        userPos.coords = {
          ...userPos.coords,
          longitude: longitude || userPos.coords.longitude,
          latitude: latitude || userPos.coords.latitude,
        };
        userPos.userPositionInfo = userPositionInfo;
        return;
      }
    }
    this.userPositions.push(position);
    this.userPositions$.next([position]);
  }

  public setUserCoordinatesAndOrZoom(
    id: string,
    coords: GeolocationCoordinates,
    zoom?: number
  ) {
    const userPos = this.getUserPosition(id);
    if (
      userPos &&
      (!isEqual(userPos.coords, coords) || userPos.zoom !== zoom)
    ) {
      userPos.coords = coords;
      if (zoom) {
        userPos.zoom = zoom;
      }
      this.userPositions$.next([userPos]);
    }
  }

  public getUserPosition(id: string): GeoPosition | undefined {
    const userPos = this.userPositions.find((userPos) => userPos.id === id);
    if (userPos) {
      return userPos;
    }
    return undefined;
  }

  public getUserPositions(): GeoPosition[] {
    return this.userPositions;
  }

  public getUserForPosition(coordinates: Coordinate): GeoPosition | undefined {
    return this.userPositions.find(
      (userPos) =>
        userPos.coords.altitude === coordinates[1] &&
        userPos.coords.longitude === coordinates[0]
    );
  }

  public removeUserPosition(id: string): GeoPosition | undefined {
    const userPosIndex = this.userPositions.findIndex(
      (userPos) => userPos.id === id
    );
    if (userPosIndex >= 0) {
      const userPos = this.userPositions.splice(userPosIndex, 1)[0];
      this.removedUserPosition$.next(userPos);
      return userPos;
    }
    return undefined;
  }
}
