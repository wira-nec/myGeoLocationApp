import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import {
  INFO,
  LATITUDE,
  LONGITUDE,
  SHEET_NAME,
  StoreData,
  getDataStoreKeys,
  getImageNames,
  imagesFilter,
} from '../../../../core/services/data-store.service';
import { blobsFilter } from '../../../../core/helpers/dataManipulations';
import { LoadPictureService } from '../../../../core/services/load-picture.service';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

const ADD_PHOTO = `        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="#BD4C31"
        >
          <path
            d="M432-433ZM120-144q-29 0-50.5-21.5T48-216v-432q0-29 21.5-50.5T120-720h120l72-96h288v72H348l-72 96H120v432h624v-384h72v384q0 29-21.15 50.5T744-144H120Zm624-528v-72h-72v-72h72v-72h72v72h72v72h-72v72h-72ZM432-264q72 0 120-49t48-119q0-69-48-118.5T432-600q-72 0-120 49.5t-48 119q0 69.5 48 118.5t120 49Zm0-72q-42 0-69-28.13T336-433q0-39.9 27-67.45Q390-528 432-528t69 27.55q27 27.55 27 67.45 0 40.74-27 68.87Q474-336 432-336Z"
          />
        </svg>
`;
@Component({
  selector: 'app-excel-content',
  imports: [CommonModule, MatIcon],
  standalone: true,
  templateUrl: './excel-content.component.html',
  styleUrl: './excel-content.component.scss',
})
export class ExcelContentComponent {
  @Input() details!: StoreData;

  constructor(private readonly pictureService: LoadPictureService) {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    // Note that we provide the icon here as a string literal here due to a limitation in
    // Stackblitz. If you want to provide the icon from a URL, you can use:
    // `iconRegistry.addSvgIcon('add-photo', sanitizer.bypassSecurityTrustResourceUrl('icon.svg'));`
    iconRegistry.addSvgIconLiteral(
      'add-photo',
      sanitizer.bypassSecurityTrustHtml(ADD_PHOTO)
    );
  }

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
              INFO,
              street,
              LONGITUDE,
              LATITUDE,
              SHEET_NAME,
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

  location(details: StoreData) {
    if (details) {
      return `longitude: ${details[LONGITUDE]} / latitude: ${details[LATITUDE]}`;
    }
    return `longitude: unknown} / latitude: unknown`;
  }

  uploadPicture() {
    (document.querySelector('#uploadPicture') as HTMLInputElement).click();
  }

  selectPicture() {
    const images = getImageNames(this.details);
    const input = document.querySelector('#uploadPicture') as HTMLInputElement;
    if (input.files && images.length) {
      this.pictureService.loadPicture(input.files[0], images[0]);
    }
  }

  hasNoBlobs(): boolean {
    const images = getImageNames(this.details);
    if (images.length) {
      return this.pictureService.hasNoBlobs(images[0]);
    }
    return true;
  }
}
