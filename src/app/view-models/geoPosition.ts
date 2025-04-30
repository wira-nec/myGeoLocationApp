import { Coordinate } from 'ol/coordinate';
import { StoreData } from '../../services/data-store.service';

export interface GeoPosition {
  id: string;
  userName: string;
  info: string;
  center?: Coordinate;
  zoom: number;
  coords: GeolocationCoordinates;
  details?: StoreData;
}
