import { Coordinate } from 'ol/coordinate';

export interface GeoPosition {
  id: string;
  userName: string;
  info: string;
  center?: Coordinate;
  zoom: number;
  coords: GeolocationCoordinates;
}
