import { Injectable } from '@angular/core';
import { GeoPosition } from '../app/view-models/geoPosition';
import { BehaviorSubject } from 'rxjs';
import { isEqual } from 'lodash';
import { Coordinate } from 'ol/coordinate';
import { StoreData } from './data-store.service';
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
    houseNumber: string
  ): GeoPosition | undefined {
    return this.userPositions.find((userPos) => {
      const userInfo = JSON.parse(userPos.info);
      const userHouseNumber = userInfo.housenumber.split('-').at(-1) as string;
      return (
        userInfo.city.toLowerCase() === city.toLowerCase() &&
        userInfo.postcode.toLowerCase() === postcode.toLowerCase() &&
        userHouseNumber.toLowerCase() === houseNumber.toLowerCase()
      );
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

  public createUserPosition(
    longitude: number,
    latitude: number,
    userName = 'Unknown',
    storeData: StoreData | undefined,
    info: string
  ) {
    const position = {
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
      info,
      zoom: 0,
      details: storeData,
    };
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
