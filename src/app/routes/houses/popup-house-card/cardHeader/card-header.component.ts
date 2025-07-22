import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  getDataStoreKeys,
  StoreData,
} from '../../../../core/services/data-store.service';
import { Map } from 'ol';
import { MapEventHandlers } from '../../providers/mapEventHandlers';

@Component({
  selector: 'app-card-header',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './card-header.component.html',
  styleUrl: './card-header.component.scss',
})
export class CardHeaderComponent {
  @Input() details!: StoreData;
  @Input() map!: Map;

  constructor(private readonly mapEventHandlers: MapEventHandlers) {}

  address() {
    if (this.details) {
      const [address, street, postcode, houseNumber, city] = getDataStoreKeys(
        this.details
      );
      if (address) {
        return this.details[address];
      } else {
        return `${this.details[city]} ${this.details[postcode]} ${
          this.details[street] ? this.details[street] + ' ' : ''
        }${this.details[houseNumber]}`;
      }
    }
    return '';
  }

  closePopup(evt: Event) {
    evt.stopPropagation();
    this.mapEventHandlers.closePopup();
  }
}
