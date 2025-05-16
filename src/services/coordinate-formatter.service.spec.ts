import { DecimalPipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { CoordinateFormatterService } from './coordinate-formatter.service';

describe('service', () => {
  let service: CoordinateFormatterService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DecimalPipe],
    });
    service = TestBed.inject(CoordinateFormatterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('numberCoordinates', () => {
    it('formats lon/lat coordinates', () => {
      const coords = [7.1234, 46.9876];
      expect(service.numberCoordinates(coords)).toBe('7, 47');
    });

    it('formats metric coordinates', () => {
      const coords = [2600000, 1600000];
      expect(service.numberCoordinates(coords, 0)).toBe('2600000, 1600000');
    });

    it('formats with correct number of digits', () => {
      const coords = [2600000, 1600000];
      expect(service.numberCoordinates(coords, 4)).toBe(
        '2600000.0000, 1600000.0000'
      );
    });
  });
});
