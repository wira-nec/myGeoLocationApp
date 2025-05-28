import { Coordinate } from 'ol/coordinate';
import { StoreData } from '../../core/services/data-store.service';

export interface GeoPosition {
  id: string;
  userName: string;
  geoPositionInfo: string;
  center?: Coordinate;
  zoom: number;
  coords: GeolocationCoordinates;
  details?: StoreData;
}
