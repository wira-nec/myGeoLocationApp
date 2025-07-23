import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import {
  DataStoreService,
  getAllHeaderInfo,
  getImageName,
  LATITUDE,
  LONGITUDE,
  StoreData,
  VOORAANZICHT,
} from '../../../../core/services/data-store.service';
import { DomSanitizer } from '@angular/platform-browser';
import { LoadPictureService } from '../../../../core/services/load-picture.service';
import { MapEventHandlers } from '../../providers/mapEventHandlers';

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

const EDIT = `
  <svg xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#BD4C31"
  >
    <path
      d="M560-80v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T903-300L683-80H560Zm300-263-37-37 37 37ZM620-140h38l121-122-18-19-19-18-122 121v38ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v120h-80v-80H520v-200H240v640h240v80H240Zm280-400Zm241 199-19-18 37 37-18-19Z"
    />
  </svg>`;

@Component({
  selector: 'app-card-footer',
  imports: [CommonModule, MatIcon],
  templateUrl: './card-footer.component.html',
  styleUrl: './card-footer.component.scss',
})
export class CardFooterComponent {
  @Input() details!: StoreData;

  constructor(
    private readonly pictureService: LoadPictureService,
    private readonly dataStoreService: DataStoreService,
    private readonly mapEventHandlers: MapEventHandlers
  ) {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);

    // Note that we provide the icon here as a string literal here due to a limitation in
    // Stackblitz. If you want to provide the icon from a URL, you can use:
    // `iconRegistry.addSvgIcon('add-photo', sanitizer.bypassSecurityTrustResourceUrl('icon.svg'));`
    iconRegistry.addSvgIconLiteral(
      'add-photo',
      sanitizer.bypassSecurityTrustHtml(ADD_PHOTO)
    );
    iconRegistry.addSvgIconLiteral(
      'edit-mode',
      sanitizer.bypassSecurityTrustHtml(EDIT)
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

  editMode(evt: MouseEvent, details: StoreData) {
    evt.stopPropagation();
    this.dataStoreService.setSelectedData(details);
    this.dataStoreService.setEditMode(true);
    this.mapEventHandlers.closePopup();
  }

  async setNewPictureAsync(details: StoreData) {
    const headerInfo = getAllHeaderInfo(
      this.dataStoreService.getStore()
    ).filter((col) => col[1]);
    let filename = getImageName(details);
    if (!filename) {
      return; // No filename available, exit early
    }
    if (headerInfo.length === 0) {
      // If no header info, use the default column name for pictures
      await this.uploadNewPicture(filename, details, VOORAANZICHT);
    } else {
      for (const col of headerInfo) {
        const pictureColName = col[0];
        filename = details[pictureColName];
        if (!filename || !filename.length) {
          filename = getImageName(details) || '';
        }
        await this.uploadNewPicture(filename, details, pictureColName);
      }
    }
  }

  private async uploadNewPicture(
    filename: string,
    details: StoreData,
    pictureColName: string
  ) {
    const input = document.querySelector('#uploadPicture') as HTMLInputElement;
    if (input.files && filename.length) {
      await this.pictureService.loadPictureAsync(input.files[0], filename);
      this.dataStoreService.changeStoreData({
        ...details,
        [pictureColName]: filename,
      });
    }
  }
}
