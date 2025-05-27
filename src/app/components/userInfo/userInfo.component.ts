import { Component, ElementRef, Input, OnInit } from '@angular/core';
import Map from 'ol/Map';
import { PopoverContainerComponent } from '../popover/popover-container/popover-container.component';
import Overlay from 'ol/Overlay';
import { GeoPositionService } from '../../../services/geo-position.service';
import { StoreData } from '../../../services/data-store.service';
import { CommonModule, KeyValue, NgFor } from '@angular/common';
import { getUid } from 'ol';
import { LoadPictureService } from '../../../services/load-picture.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [PopoverContainerComponent, CommonModule, NgFor],
  templateUrl: './userInfo.component.html',
  styleUrl: './userInfo.component.scss',
})
export class UserInfoComponent implements OnInit {
  @Input() map: Map | null = null;

  constructor(
    private ref: ElementRef,
    private geoPositionService: GeoPositionService,
    private pictureService: LoadPictureService
  ) {}

  details!: StoreData;
  private overlay!: Overlay;

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
        if (this.overlay && this.map) {
          this.map.removeOverlay(this.overlay);
          const pixel = this.map.getEventPixel(event.originalEvent);
          if (pixel) {
            this.map.forEachFeatureAtPixel(pixel, (feature) => {
              const uid = getUid(feature);
              const geoPositionId = this.geoPositionService.getIdByUid(uid);
              if (geoPositionId) {
                const selectedGeoPos =
                  this.geoPositionService.getGeoPosition(geoPositionId);
                if (selectedGeoPos?.details) {
                  this.details = selectedGeoPos.details;
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

  getValueOrImage(item: KeyValue<string, string>) {
    if (this.isUrlItem(item.value)) {
      const pictureName = item.value.replace(/^.*[\\/]/, '');
      const picture = this.pictureService.getPicture(pictureName);
      return `<img src='${picture}' height="50px" width="50px" alt="'${item.value}' not found">`;
    } else {
      return item.value;
    }
  }
}
