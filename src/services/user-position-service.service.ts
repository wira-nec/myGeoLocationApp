import { Injectable } from '@angular/core';
import { GeoPosition } from '../app/view-models/geoPosition';
import { BehaviorSubject } from 'rxjs';
import { isEqual } from 'lodash';

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
export class UserPositionServiceService {
  private userPositions: GeoPosition[];
  removedUserPosition$ = new BehaviorSubject<GeoPosition | null>(null);
  userPositions$ = new BehaviorSubject<GeoPosition>(initialGeoPosition);

  constructor() {
    this.userPositions = [];
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
