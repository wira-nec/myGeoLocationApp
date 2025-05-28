import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, shareReplay } from 'rxjs/operators';
import { GEOLOCATION } from '../tokens/geoLocation';
import { POSITION_OPTIONS } from '../tokens/geoLocationOptions';
import { GEOLOCATION_SUPPORT } from '../tokens/geoLocationSupport';

// @dynamic
@Injectable({
  providedIn: 'root',
})
export class GeolocationService extends Observable<
  Parameters<PositionCallback>[0]
> {
  constructor(
    @Inject(GEOLOCATION) geolocationRef: Geolocation,
    @Inject(GEOLOCATION_SUPPORT) geolocationSupported: boolean,
    @Inject(POSITION_OPTIONS)
    positionOptions: PositionOptions
  ) {
    let watchPositionId = 0;

    super((subscriber) => {
      if (!geolocationSupported) {
        subscriber.error('Geolocation is not supported in your browser');
      }

      watchPositionId = geolocationRef.watchPosition(
        (position) => subscriber.next(position),
        (positionError) => subscriber.error(positionError),
        positionOptions
      );
    });

    return this.pipe(
      finalize(() => geolocationRef.clearWatch(watchPositionId)),
      shareReplay({ bufferSize: 1, refCount: true })
    ) as GeolocationService;
  }
}
