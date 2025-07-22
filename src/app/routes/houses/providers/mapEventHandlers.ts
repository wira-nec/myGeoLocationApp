import { Injectable } from '@angular/core';
import { FontSizeService } from '../../../core/services/font-size.service';
import {
  DataStoreService,
  StoreData,
} from '../../../core/services/data-store.service';
import { BasicEventHandlers } from './basicEventHandler';

export type OnClickHandler = (data: StoreData) => void;

@Injectable({
  providedIn: 'root',
})
export class MapEventHandlers extends BasicEventHandlers {
  constructor(
    fontSizeService: FontSizeService,
    dataStoreService: DataStoreService
  ) {
    super(fontSizeService, dataStoreService);
  }
}
