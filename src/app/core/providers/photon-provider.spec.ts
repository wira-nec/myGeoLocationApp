import { TestBed } from '@angular/core/testing';

import { PhotonProvider } from './photon-provider';

describe('PhotonProvider', () => {
  let service: PhotonProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotonProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
