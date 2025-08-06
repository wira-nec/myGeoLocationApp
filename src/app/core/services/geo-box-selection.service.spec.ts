import { Markers } from '../../routes/houses/providers/markers';
import { GeoBoxSelectionService } from './geo-box-selection.service';

describe('GeoBoxSelection', () => {
  it('should create an instance', () => {
    const markersMock = {} as Markers;
    expect(new GeoBoxSelectionService(markersMock)).toBeTruthy();
  });
});
