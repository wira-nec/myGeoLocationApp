import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  CITY,
  HOUSE_NUMBER,
  POSTCODE,
  StoreData,
  STREET,
} from '../../../services/data-store.service';
import { Overlay } from 'ol';

@Component({
  selector: 'app-card-header',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './card-header.component.html',
  styleUrl: './card-header.component.scss',
})
export class CardHeaderComponent {
  @Input() details!: StoreData;
  @Input() overlay!: Overlay;

  address() {
    if (this.details) {
      return `${this.details[CITY]}, ${this.details[POSTCODE]}, ${
        this.details[STREET] || ''
      }, ${this.details[HOUSE_NUMBER]}`;
    }
    return '';
  }

  closePopup() {
    this.overlay.setPosition(undefined);
  }
}
