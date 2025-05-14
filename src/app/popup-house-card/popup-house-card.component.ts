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
import {
  getBlobs,
  getImageNames,
  StoreData,
} from '../../services/data-store.service';
import Overlay from 'ol/Overlay';
import { getUid } from 'ol/util';
import { CommonModule, NgClass } from '@angular/common';
import { FontSizeService } from '../../services/font-size.service';
import { CardHeaderComponent } from './cardHeader/card-header.component';
import { ExcelContentComponent } from './excel-content/excel-content.component';
import { PicturesContentComponent } from './pictures-content/pictures-content.component';
import { MapBrowserEvent } from 'ol';
import { LoadPictureService } from '../../services/load-picture.service';

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
    private userPositionService: UserPositionService,
    public changeDetectorRef: ChangeDetectorRef,
    readonly fontSizeService: FontSizeService,
    private pictureService: LoadPictureService
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
  }

  hasPictures(details: StoreData) {
    if (details) {
      if (getBlobs(details).length > 0 || getImageNames(details).length > 0) {
        return true;
      }
    }
    return false;
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
