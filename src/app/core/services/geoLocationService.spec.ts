import { TestBed } from '@angular/core/testing';
import { catchError } from 'rxjs/operators';
import { GeolocationService } from './geoLocationService';

describe('Geolocation token', () => {
  let service: unknown;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeolocationService],
    });

    service = TestBed.get(GeolocationService).pipe(
      catchError((_err, caught) => caught)
    );
  });

  it('defined', () => {
    expect(service).toBeDefined();
  });
});
