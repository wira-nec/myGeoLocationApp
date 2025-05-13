import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StoreData } from '../../../services/data-store.service';
import { FIXED_DETAIL_COLUMNS } from '../../../services/data-store.service';
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
      return `${this.details[FIXED_DETAIL_COLUMNS[0]]}, ${
        this.details[FIXED_DETAIL_COLUMNS[1]]
      }, ${this.details[FIXED_DETAIL_COLUMNS[2]]}`;
    }
    return '';
  }

  closePopup() {
    this.overlay.setPosition(undefined);
  }
}
