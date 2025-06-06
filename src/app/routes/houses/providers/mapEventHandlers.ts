import { Injectable } from '@angular/core';
import { GeoPositionService } from '../../../core/services/geo-position.service';
import { FontSizeService } from '../../../core/services/font-size.service';
import { StoreData } from '../../../core/services/data-store.service';
import { BasicEventHandlers } from './basicEventHandler';

export type OnClickHandler = (data: StoreData) => void;

@Injectable({
  providedIn: 'root',
})
export class MapEventHandlers extends BasicEventHandlers {
  constructor(
    geoPositionService: GeoPositionService,
    fontSizeService: FontSizeService
  ) {
    super(geoPositionService, fontSizeService);
  }
}
