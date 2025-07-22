import { Injectable } from '@angular/core';
import { Map, MapBrowserEvent, Overlay } from 'ol';
import { FontSizeService } from '../../../core/services/font-size.service';
import {
  CITY,
  DataStoreService,
  ERROR,
  HOUSE_NUMBER,
  POSTCODE,
  StoreData,
  STREET,
} from '../../../core/services/data-store.service';
import Feature, { FeatureLike } from 'ol/Feature';
import { Pixel } from 'ol/pixel';
import { Coordinate } from 'ol/coordinate';
import {
  ADDRESS_PROPERTY,
  GEO_INFORMATION_PROPERTY,
  SEARCH_FOR_MARKER_ID,
  STORE_DATA_ID_PROPERTY,
} from './markers';
import { Geometry } from 'ol/geom';
import { Style } from 'ol/style';

export type OnClickHandler = (data: StoreData) => void;

@Injectable({
  providedIn: 'root',
})
export class BasicEventHandlers {
  private map!: Map;
  private currentFeature: FeatureLike | undefined;
  private currentCoordinates: Coordinate | undefined;
  private info!: HTMLElement;
  private overlay!: Overlay;
  private tooltipSwitchedOn = true;
  private onClickHandler: OnClickHandler | null = null;

  constructor(
    private readonly fontSizeService: FontSizeService,
    private readonly dataStoreService: DataStoreService
  ) {}

  public assignTooltipHandlers(
    map: Map,
    tooltipElement: HTMLElement | undefined
  ) {
    if (tooltipElement) {
      this.info = tooltipElement;
    }
    if (map && !this.map) {
      this.map = map;
    }
    map.on('loadstart', () => {
      map.getTargetElement().classList.add('spinner');
    });

    map.on('loadend', () => {
      map.getTargetElement().classList.remove('spinner');
    });
    map.on('pointermove', this.pointerMove);

    map.getTargetElement().addEventListener('pointerleave', () => this.reset());
  }

  public assignClickHandler(
    map: Map,
    onClick: OnClickHandler | null,
    nativeElement: HTMLElement
  ) {
    if (map && !this.map) {
      this.map = map;
    }
    if (map && onClick) {
      this.onClickHandler = onClick;
      this.overlay = new Overlay({
        element: nativeElement,
        autoPan: true,
        id: 'popup-house-card-overlay',
      });
      this.overlay.panIntoView({
        animation: {
          duration: 1000,
        },
        margin: 100,
      });
      this.overlay.on('propertychange', this.switchTooltipOnOff.bind(this));
      map.on('click', this.showPopUp.bind(this));
    }
  }

  public closePopup() {
    if (this.overlay) {
      this.overlay.setPosition(undefined);
      this.tooltipSwitchedOn = false;
      this.switchTooltipOnOff();
      this.map.removeOverlay(this.overlay);
    }
  }

  private showPopUp(
    event: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>
  ) {
    if (this.map) {
      if (this.overlay && this.onClickHandler) {
        if (this.currentFeature) {
          this.handleFeature(this.currentFeature, this.currentCoordinates);
        } else {
          const pixel = this.map.getEventPixel(event.originalEvent);
          if (pixel) {
            this.map.forEachFeatureAtPixel(
              pixel,
              (feature) => {
                this.handleFeature(feature, event.coordinate);
              },
              {
                hitTolerance: this.fontSizeService.fontSize$.value < 3 ? 10 : 0,
              }
            );
          }
        }
      }
    }
  }

  private handleFeature(
    feature: FeatureLike,
    coordinate: Coordinate | undefined
  ) {
    if (feature.getId() === SEARCH_FOR_MARKER_ID) {
      // Hide the search marker
      (feature as Feature<Geometry>).setStyle(new Style({}));
      return;
    }
    const storeDataId = feature.get(STORE_DATA_ID_PROPERTY);
    const details = feature.get(GEO_INFORMATION_PROPERTY) as string | undefined;
    if (storeDataId && this.onClickHandler) {
      const storeData = this.dataStoreService.getById(storeDataId);
      if (!storeData) {
        const geoInfo = JSON.parse(
          details
            ? details
            : `{
                  "postcode": "column 'postcode' not found",
                  "city": "column 'city' not found",
                  "housenumber": "column 'housenumber' not found"
                }`
        );
        const address_not_found = details
          ? `Address "${geoInfo.street} ${geoInfo.housenumber}, ${geoInfo.postcode} ${geoInfo.city}" not found`
          : 'No address found';
        this.onClickHandler({
          [ERROR]: `${address_not_found}. Please verify address in excel sheet.`,
          [POSTCODE]: geoInfo.postcode,
          [CITY]: geoInfo.city,
          [HOUSE_NUMBER]: geoInfo.housenumber,
          [STREET]: geoInfo.street,
        });
      } else {
        this.onClickHandler(storeData);
      }
      if (this.overlay && this.map) {
        this.overlay.setPosition(coordinate);
        this.map.addOverlay(this.overlay);
        this.reset();
      }
    }
  }

  private handlePointerMove(
    evt: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>
  ) {
    if (evt.dragging && this.info) {
      this.info.style.visibility = 'hidden';
      this.currentFeature = undefined;
      this.currentCoordinates = undefined;
      return;
    }
    const pixel = this.map.getEventPixel(evt.originalEvent);
    this.displayFeatureInfo(pixel, evt.originalEvent.target);
    this.currentCoordinates = evt.coordinate;
  }

  private displayFeatureInfo(pixel: Pixel, target: EventTarget | null) {
    if (this.info && this.map && target) {
      const feature = this.map.forEachFeatureAtPixel(
        pixel,
        function (feature: FeatureLike) {
          return feature;
        },
        {
          hitTolerance: this.fontSizeService.fontSize$.value < 3 ? 10 : 0,
        }
      );
      if (feature) {
        this.info.style.left = pixel[0] + 'px';
        this.info.style.top = pixel[1] + 'px';
        if (feature !== this.currentFeature) {
          this.info.style.visibility = 'visible';
          this.info.innerText = feature.get(ADDRESS_PROPERTY);
        }
      } else {
        this.info.style.visibility = 'hidden';
      }
      this.currentFeature = feature;
    }
  }

  private reset(): void {
    if (this.info) {
      this.currentFeature = undefined;
      this.currentCoordinates = undefined;
      this.info.style.visibility = 'hidden';
    }
  }

  private pointerMove = (
    evt: MapBrowserEvent<KeyboardEvent | WheelEvent | PointerEvent>
  ) => this.handlePointerMove(evt);

  private switchTooltipOnOff(): void {
    setTimeout(() => {
      if (
        document.getElementsByClassName('house-card').length === 0 ||
        this.overlay.getElement()?.parentElement?.style.display === 'none'
      ) {
        if (!this.tooltipSwitchedOn) {
          this.map.on('pointermove', this.pointerMove);
          this.tooltipSwitchedOn = true;
        }
      } else if (this.tooltipSwitchedOn) {
        this.map.un('pointermove', this.pointerMove);
        this.tooltipSwitchedOn = false;
      }
    }, 1);
  }
}
