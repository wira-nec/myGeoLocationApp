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
import { MatListModule } from '@angular/material/list';
import Map from 'ol/Map';
import { UserPositionService } from '../../services/user-position.service';
import { LoadPictureService } from '../../services/load-picture.service';
import { StoreData } from '../../services/data-store.service';
import Overlay from 'ol/Overlay';
import { getUid } from 'ol/util';
import { CommonModule, KeyValue } from '@angular/common';

@Component({
  selector: 'app-popup-house-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatGridListModule,
    CommonModule,
  ],
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
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  details!: StoreData;
  private overlay!: Overlay;
  private fixedDetailKeys = ['postcode', 'city', 'housenumber', 'picture'];

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
    if (this.map) {
      this.map.on('click', (event) => {
        this.changeDetectorRef.markForCheck();
        if (this.overlay && this.map) {
          this.map.removeOverlay(this.overlay);
          const pixel = this.map.getEventPixel(event.originalEvent);
          if (pixel) {
            this.map.forEachFeatureAtPixel(pixel, (feature) => {
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
            });
          }
        }
      });
    }
  }

  address(details: StoreData) {
    if (details) {
      return `${details['postcode']}, ${details['city']}, ${details['housenumber']}`;
    }
    return '';
  }

  picture(details: StoreData) {
    if (details) {
      const pictureName = details['picture'].replace(/^.*[\\/]/, '');
      return this.pictureService.getPicture(pictureName);
    }
    return '';
  }

  extraInformation(details: StoreData) {
    if (details) {
      return Object.entries(details).filter(
        (entry) => !this.fixedDetailKeys.includes(entry[0])
      );
    }
    return [];
  }
}
