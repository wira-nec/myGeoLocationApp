import { Coordinate } from 'ol/coordinate';

export interface GeoPosition {
  id: number;
  lat: number;
  lng: number;
  info: string;
  center?: Coordinate;
  zoom: number;
}
