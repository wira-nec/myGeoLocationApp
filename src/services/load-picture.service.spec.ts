import { TestBed } from '@angular/core/testing';

import { LoadPictureService } from './load-picture.service';

describe('LoadPictureService', () => {
  let service: LoadPictureService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadPictureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
