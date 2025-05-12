import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { StoreData } from '../../../services/data-store.service';
import {
  blobsFilter,
  FIXED_DETAIL_COLUMNS,
  imagesFilter,
} from '../../helpers/dataManipulations';

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
            !FIXED_DETAIL_COLUMNS.includes(entry[0]) &&
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
