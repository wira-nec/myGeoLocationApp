import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  CITY,
  HOUSE_NUMBER,
  INFO,
  LATITUDE,
  LONGITUDE,
  POSTCODE,
  STREET,
  StoreData,
  imagesFilter,
} from '../../../services/data-store.service';
import { blobsFilter } from '../../helpers/dataManipulations';

@Component({
  selector: 'app-excel-content',
  imports: [CommonModule],
  templateUrl: './excel-content.component.html',
  styleUrl: './excel-content.component.scss',
})
export class ExcelContentComponent {
  @Input() details!: StoreData;

  private isUrlItem(item: string) {
    try {
      new URL(item);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return false;
    }
  }

  extraInformation(details: StoreData) {
    if (details) {
      return Object.entries(details)
        .filter(
          (entry) =>
            ![
              POSTCODE,
              CITY,
              HOUSE_NUMBER,
              INFO,
              STREET,
              LONGITUDE,
              LATITUDE,
            ].includes(entry[0]) &&
            !imagesFilter(entry[1]) &&
            !blobsFilter(entry[1])
        )
        .map((info) => {
          if (this.isUrlItem(info[1])) {
            return [
              info[0],
              `<a href="${info[1]}" target="_blank">${info[1]}</a>`,
            ];
          }
          return info;
        });
    }
    return [];
  }
}
