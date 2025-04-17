import { Injectable } from '@angular/core';
import { Coordinate, toStringXY } from 'ol/coordinate';

@Injectable({
  providedIn: 'root',
})
export class CoordinateFormatterService {
  numberCoordinates(
    coordinates: Coordinate | undefined = [0, 0],
    fractionDigits = 0
  ) {
    const out = toStringXY(coordinates, fractionDigits);
    return out;
  }
}
