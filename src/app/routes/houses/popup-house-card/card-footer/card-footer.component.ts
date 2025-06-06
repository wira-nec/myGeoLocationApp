import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import {
  getImageNames,
  LATITUDE,
  LONGITUDE,
  StoreData,
} from '../../../../core/services/data-store.service';
import { DomSanitizer } from '@angular/platform-browser';
import { LoadPictureService } from '../../../../core/services/load-picture.service';

const ADD_PHOTO = `
  <svg
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
  selector: 'app-card-footer',
  imports: [CommonModule, MatIcon],
  templateUrl: './card-footer.component.html',
  styleUrl: './card-footer.component.scss',
})
export class CardFooterComponent {
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

  location(details: StoreData) {
    if (details) {
      return `longitude: ${details[LONGITUDE]} / latitude: ${details[LATITUDE]}`;
    }
    return `longitude: unknown} / latitude: unknown`;
  }

  uploadPicture() {
    (document.querySelector('#uploadPicture') as HTMLInputElement).click();
  }

  selectPicture(details: StoreData) {
    const images = getImageNames(details);
    const input = document.querySelector('#uploadPicture') as HTMLInputElement;
    if (input.files && images.length) {
      this.pictureService.loadPicture(input.files[0], images[0]);
    }
  }
}
