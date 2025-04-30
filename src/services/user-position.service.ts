import { Injectable } from '@angular/core';
import { GeoPosition } from '../app/view-models/geoPosition';
import { BehaviorSubject } from 'rxjs';
import { isEqual } from 'lodash';
import { Coordinate } from 'ol/coordinate';

interface IdMapper {
  id: string;
  uid: string;
}

const initialGeoPosition: GeoPosition = {
  id: '',
  userName: '',
  info: '',
  zoom: 0,
  coords: {
    accuracy: 0,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: 0,
    longitude: 0,
    speed: null,
    toJSON: function () {
      throw new Error('Function not implemented.');
    },
  },
};

@Injectable({
  providedIn: 'root',
})
export class UserPositionService {
  private userPositions: GeoPosition[] = [];
  private mapIdToUuid: IdMapper[] = [];
  removedUserPosition$ = new BehaviorSubject<GeoPosition | null>(null);
  userPositions$ = new BehaviorSubject<GeoPosition>(initialGeoPosition);

  public setUserIdUid(id: string, olUid: string) {
    const idMap = this.mapIdToUuid.find((map) => map.id === id);
    if (idMap) {
      idMap.uid = olUid;
    } else {
      this.mapIdToUuid.push({ id, uid: olUid });
    }
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

  public addUserPosition(geoPosition: GeoPosition) {
    const userPos = {
      ...geoPosition,
    };
    this.userPositions.push(userPos);
    this.userPositions$.next(userPos);
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
      this.userPositions$.next(userPos);
    }
  }

  public getUserPosition(id: string): GeoPosition | undefined {
    const userPos = this.userPositions.find((userPos) => userPos.id === id);
    if (userPos) {
      return userPos;
    }
    return undefined;
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
