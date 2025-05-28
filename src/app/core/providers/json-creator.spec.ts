import { TestBed } from '@angular/core/testing';

import { JsonCreator } from './json-creator';

describe('JsonCreator', () => {
  let service: JsonCreator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonCreator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
