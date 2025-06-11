import { TestBed } from '@angular/core/testing';

import { GeoCoderService } from './geo-coder.service';

describe('GeoCoderService', () => {
  let service: GeoCoderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoCoderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
