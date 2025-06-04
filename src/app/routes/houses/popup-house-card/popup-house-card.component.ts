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
import { GeoPositionService } from '../../../core/services/geo-position.service';
import {
  CITY,
  hasPictures,
  HOUSE_NUMBER,
  POSTCODE,
  StoreData,
  STREET,
} from '../../../core/services/data-store.service';
import Overlay from 'ol/Overlay';
import { getUid } from 'ol/util';
import { CommonModule, NgClass } from '@angular/common';
import { FontSizeService } from '../../../core/services/font-size.service';
import { CardHeaderComponent } from './cardHeader/card-header.component';
import { ExcelContentComponent } from './excel-content/excel-content.component';
import { PicturesContentComponent } from './pictures-content/pictures-content.component';
import { MapBrowserEvent } from 'ol';

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
    CardHeaderComponent,
    ExcelContentComponent,
    PicturesContentComponent,
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
    private geoPositionService: GeoPositionService,
    public changeDetectorRef: ChangeDetectorRef,
    readonly fontSizeService: FontSizeService
  ) {}

  details!: StoreData;
  overlay!: Overlay;

  private showPopUp(
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>
  ) {
    this.changeDetectorRef.markForCheck();
    if (this.overlay && this.map) {
      this.map.removeOverlay(this.overlay);
      const pixel = this.map.getEventPixel(event.originalEvent);
      if (pixel) {
        this.map.forEachFeatureAtPixel(
          pixel,
          (feature) => {
            const uid = getUid(feature);
            const geoPositionId = this.geoPositionService.getIdByUid(uid);
            if (geoPositionId) {
              const selectedGeoPos =
                this.geoPositionService.getGeoPosition(geoPositionId);
              if (!selectedGeoPos?.details) {
                const geoInfo = JSON.parse(
                  selectedGeoPos
                    ? selectedGeoPos.geoPositionInfo
                    : `{
                        "postcode": "column 'postcode' not found",
                        "city": "column 'city' not found",
                        "housenumber": "column 'housenumber' not found"
                      }`
                );
                const address_not_found = selectedGeoPos
                  ? `Address "${geoInfo.street} ${geoInfo.housenumber}, ${geoInfo.postcode} ${geoInfo.city}" not found`
                  : 'No address found';
                this.details = {
                  ['Error']: `${address_not_found}. Please verify address in excel sheet.`,
                  [POSTCODE]: geoInfo.postcode,
                  [CITY]: geoInfo.city,
                  [HOUSE_NUMBER]: geoInfo.housenumber,
                  [STREET]: geoInfo.street,
                };
              } else {
                this.details = selectedGeoPos.details;
              }
              if (this.overlay && this.map) {
                this.overlay.setPosition(event.coordinate);
                this.map.addOverlay(this.overlay);
              }
            }
          },
          {
            hitTolerance: this.fontSizeService.fontSize$.value < 3 ? 10 : 5,
          }
        );
      }
    }
  }

  checkIfItHasPictures(): boolean {
    return hasPictures(this.details);
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
      this.map.on('click', (e) => this.showPopUp(e));
    }
  }
}
