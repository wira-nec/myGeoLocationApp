import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  ERROR,
  GEO_INFO,
  LATITUDE,
  LONGITUDE,
  SHEET_NAME,
  StoreData,
  getDataStoreKeys,
  imagesFilter,
} from '../../../../core/services/data-store.service';
import { blobsFilter } from '../../../../core/helpers/dataManipulations';

@Component({
  selector: 'app-excel-content',
  imports: [CommonModule],
  standalone: true,
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
      const [address, street, , houseNumber, city] = getDataStoreKeys(
        this.details
      );
      return Object.entries(details)
        .filter(
          (entry) =>
            ![
              address,
              city,
              houseNumber,
              GEO_INFO,
              street,
              LONGITUDE,
              LATITUDE,
              SHEET_NAME,
              ERROR,
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
