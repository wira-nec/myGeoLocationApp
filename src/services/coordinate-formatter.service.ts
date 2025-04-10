import { Injectable } from '@angular/core';
import { Coordinate, toStringXY } from 'ol/coordinate';

@Injectable({
  providedIn: 'root',
})
export class CoordinateFormatterService {
  constructor() {}

  numberCoordinates(
    coordinates: Coordinate | undefined = [0, 0],
    fractionDigits: number = 0
  ) {
    const out = toStringXY(coordinates, fractionDigits);
    return out;
  }
}
