import { TestBed } from '@angular/core/testing';

import { UserPositionServiceService } from './user-position-service.service';

describe('UserPositionServiceService', () => {
  let service: UserPositionServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserPositionServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
