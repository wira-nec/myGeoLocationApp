import { TestBed } from '@angular/core/testing';

import { JsonCreatorService } from './json-creator.service';

describe('JsonCreatorService', () => {
  let service: JsonCreatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonCreatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
