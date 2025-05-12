import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import Map from 'ol/Map';
import { UserPositionService } from '../../services/user-position.service';
import { LoadPictureService } from '../../services/load-picture.service';
import { StoreData } from '../../services/data-store.service';
import Overlay from 'ol/Overlay';
import { getUid } from 'ol/util';
import { CommonModule, NgClass } from '@angular/common';
import { FontSizeService } from '../../services/font-size.service';
import {
  blobsFilter,
  getBlobs,
  getImageNames,
  imagesFilter,
} from '../helpers/dataManipulations';

@Component({
  selector: 'app-popup-house-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatGridListModule,
    MatIconModule,
    CommonModule,
  ],
  hostDirectives: [NgClass],
  templateUrl: './popup-house-card.component.html',
  styleUrl: './popup-house-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopupHouseCardComponent implements OnInit {
  @Input() map: Map | null = null;

  constructor(
    private ref: ElementRef,
    private userPositionService: UserPositionService,
    private pictureService: LoadPictureService,
    private changeDetectorRef: ChangeDetectorRef,
    readonly fontSizeService: FontSizeService
  ) {}

  details!: StoreData;
  private overlay!: Overlay;
  private fixedDetailKeys = [
    'postcode',
    'city',
    'housenumber',
    'userPositionInfo',
  ];

  isUrlItem(item: string) {
    try {
      new URL(item);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return false;
    }
  }

  ngOnInit() {
    this.overlay = new Overlay({
      element: this.ref.nativeElement,
      autoPan: true,
    });
    this.overlay.panIntoView({
      animation: {
        duration: 1000,
      },
      margin: 100,
    });
    if (this.map) {
      this.map.on('click', (event) => {
        this.changeDetectorRef.markForCheck();
        if (this.overlay && this.map) {
          this.map.removeOverlay(this.overlay);
          const pixel = this.map.getEventPixel(event.originalEvent);
          if (pixel) {
            this.map.forEachFeatureAtPixel(
              pixel,
              (feature) => {
                const uid = getUid(feature);
                const userId = this.userPositionService.getUserIdByUid(uid);
                if (userId) {
                  const selectedUserPos =
                    this.userPositionService.getUserPosition(userId);
                  if (selectedUserPos?.details) {
                    this.details = selectedUserPos.details;
                    if (this.overlay && this.map) {
                      this.overlay.setPosition(event.coordinate);
                      this.map.addOverlay(this.overlay);
                    }
                  }
                }
              },
              {
                hitTolerance: this.fontSizeService.fontSize$.value < 3 ? 10 : 5,
              }
            );
          }
        }
      });
    }
  }

  closePopup() {
    this.overlay.setPosition(undefined);
  }

  address(details: StoreData) {
    if (details) {
      return `${details['postcode']}, ${details['city']}, ${details['housenumber']}`;
    }
    return '';
  }

  pictures(details: StoreData) {
    if (details) {
      const blobs = getBlobs(details);
      getImageNames(details).map((imageName) =>
        blobs.push(
          this.pictureService.getPicture(imageName.replace(/^.*[\\\/]/, ''))
        )
      );
      return blobs;
    }
    return [];
  }

  extraInformation(details: StoreData) {
    if (details) {
      return Object.entries(details)
        .filter(
          (entry) =>
            !this.fixedDetailKeys.includes(entry[0]) &&
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
