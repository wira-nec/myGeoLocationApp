import { TestBed } from '@angular/core/testing';

import { BinarySemaphoreService } from './binary-semaphore.service';

describe('BinarySemaphoreService', () => {
  let service: BinarySemaphoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BinarySemaphoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
