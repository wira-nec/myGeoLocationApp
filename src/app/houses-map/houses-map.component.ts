import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  DestroyRef,
  ViewContainerRef,
} from '@angular/core';
import Map from 'ol/Map';
import { OlMapComponent } from '../components/map/map.component';
import { Feature, getUid, View } from 'ol';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { ObjectEvent } from 'ol/Object';
import VectorLayer from 'ol/layer/Vector';
import { OSM, Vector } from 'ol/source';
import { Geometry, Point } from 'ol/geom';
import { UserPositionService } from '../../services/user-position.service';
import { DataStoreService, StoreData } from '../../services/data-store.service';
import olGeocoder from 'ol-geocoder';
import { v4 as uuidv4 } from 'uuid';
import { Fill, Icon, Text, Stroke, Style } from 'ol/style';
import { GeoPosition } from '../view-models/geoPosition';
import { Attribution, defaults as defaultControls } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import { PopupHouseCardComponent } from '../popup-house-card/popup-house-card.component';
import CircleStyle from 'ol/style/Circle';
import { StyleLike } from 'ol/style/Style';
import { FilesImportControlComponent } from '../files-import-control/files-import-control.component';

@Component({
  selector: 'app-houses-map',
  standalone: true,
  imports: [PopupHouseCardComponent, OlMapComponent],
  templateUrl: './houses-map.component.html',
  styleUrl: './houses-map.component.scss',
  providers: [FilesImportControlComponent],
})
export class HousesMapComponent implements OnInit, AfterViewInit {
  map: Map | null = null;

  private zoomLevelSingleMarker = 13;
  private userMarkers: Record<string, Feature> = {};
  private zoomInput = new Subject<ObjectEvent>();
  private markersVectorLayer = new VectorLayer<
    Vector<Feature<Geometry>>,
    Feature<Geometry>
  >();
  private textInput!: HTMLInputElement | null;
  private sendTextInput!: HTMLButtonElement | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private geocoder!: any;
  private destroyRef = inject(DestroyRef);
  private filesImportComponent = inject(FilesImportControlComponent);
  private viewContainer = inject(ViewContainerRef);

  constructor(
    private readonly userPositionService: UserPositionService,
    private readonly dataStoreService: DataStoreService
  ) {
    this.zoomInput
      .pipe(takeUntilDestroyed())
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.onViewChanged();
      });
  }

  ngOnInit(): void {
    if (!this.map) {
      this.initializeMap();
      this.geocoder = new olGeocoder('nominatim', {
        provider: 'photon',
        placeholder: 'Search for ...',
        targetType: 'text-input',
        limit: 1,
        keepOpen: true,
        target: document.body,
      });
      (this.map as unknown as Map).addControl(this.geocoder);
      this.geocoder.getLayer().setVisible(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.geocoder.on('addresschosen', (evt: any) => {
        const originalDetails = evt.address.original.details;
        const storeData = this.dataStoreService.get({
          postcode: originalDetails.postcode,
          housenumber: evt.address.original.details.housenumber,
          city: originalDetails.city,
        });
        console.log('street map found', originalDetails);
        this.userPositionService.addUserPosition({
          coords: {
            altitude: 0,
            longitude: evt.place.lon,
            accuracy: 0,
            altitudeAccuracy: null,
            heading: null,
            latitude: evt.place.lat,
            speed: null,
            toJSON: function () {
              throw new Error('Function not implemented.');
            },
          },
          id: uuidv4(),
          userName: storeData ? storeData['firstName'] : 'Unknown',
          info: JSON.stringify(originalDetails),
          zoom: 0,
          details: storeData,
        });
      });
    }
  }

  ngAfterViewInit(): void {
    const ref = this.viewContainer.createComponent(
      FilesImportControlComponent
    ).instance;
    this.map?.addControl(ref.getFilesImportControl());
    ref.openBottomSheet();

    this.textInput = document.querySelector('.gcd-txt-input');
    this.sendTextInput = document.querySelector('.gcd-txt-search');
    this.userPositionService.userPositions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((userPositions) => {
        if (userPositions && userPositions.id.length) {
          this.setupMap([userPositions]);
        }
      });
    this.userPositionService.removedUserPosition$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((removedUserPosition) => {
        if (removedUserPosition) {
          this.updateMap(removedUserPosition);
        }
      });
    this.dataStoreService.dataStore$.subscribe((data) => {
      this.userMarkers = {};
      data.forEach((data) => {
        if (this.textInput && this.sendTextInput) {
          this.textInput.value = this.getAddress(data);
          console.log('search street map for', this.textInput.value);
          this.sendTextInput.click();
        }
      });
      if (this.map && this.markersVectorLayer) {
        const vectorLayerSource = this.markersVectorLayer.getSource();
        if (vectorLayerSource) {
          this.map.getView().fit(vectorLayerSource.getExtent(), {
            size: this.map.getSize(),
            maxZoom: this.zoomLevelSingleMarker,
          });
        }
      }
    });
  }

  private onViewChanged = () => {
    const view = this.map?.getView();
    this.zoomLevelSingleMarker = view?.getZoom() || 13;
    this.updateUserMarkerStyle();
    console.log('zoom', this.zoomLevelSingleMarker);
  };

  private getAddress(data: StoreData): string {
    return `${data['postcode']}, ${data['city']}, ${data['housenumber']}`;
  }

  private refreshVectorLayer() {
    const vectorLayerSource = this.markersVectorLayer.getSource();
    if (vectorLayerSource) {
      vectorLayerSource.clear(true);
      vectorLayerSource.addFeatures(Object.values(this.userMarkers));
    }
  }

  private styleUser = (feature: Feature, labelText: string) => {
    if (!feature) return;

    feature.setStyle(this.getHouseStyle(labelText));
  };

  private getHouseStyle(labelText: string): StyleLike | undefined {
    return new Style({
      image: new Icon({
        src: 'assets/icons8-house-30.png',
        size: [60, 60],
        anchor: [0, 0],
        opacity: 0.7,
        scale: 0.5,
      }),
      text: new Text({
        text: labelText,
        font: 'bold 12px Calibri,sans-serif',
        offsetY: -5,
        fill: new Fill({
          color: 'blue',
        }),
        stroke: new Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    });
  }

  private getDotStyle: StyleLike | undefined = new Style({
    image: new CircleStyle({
      radius: 4,
      fill: new Fill({ color: 'black' }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  });

  private updateUserMarkerStyle() {
    Object.keys(this.userMarkers).forEach((key) => {
      if (this.zoomLevelSingleMarker > 15.5) {
        const userPos = this.userPositionService.getUserPosition(key);
        let labelText = '';
        if (userPos?.details) {
          labelText = this.getAddress(userPos.details);
        } else {
          labelText = userPos?.userName || 'Unknown';
        }
        this.userMarkers[key].setStyle(this.getHouseStyle(labelText));
      } else {
        this.userMarkers[key].setStyle(this.getDotStyle);
      }
      this.userMarkers[key].changed();
    });
    this.refreshVectorLayer();
  }

  private setupMap(userPositions: GeoPosition[]) {
    const view = this.map?.getView();
    view?.setZoom(this.zoomLevelSingleMarker);
    userPositions.forEach((userPosition) => {
      if (!Object.keys(this.userMarkers).includes(userPosition.id)) {
        this.userMarkers[userPosition.id] = new Feature<Geometry>();
        this.userPositionService.setUserIdUid(
          userPosition.id,
          getUid(this.userMarkers[userPosition.id])
        );
      }
      const coords = [
        userPosition.coords.longitude,
        userPosition.coords.latitude,
      ];
      this.userMarkers[userPosition.id].setGeometry(
        new Point(fromLonLat(coords))
      );
      this.styleUser(
        this.userMarkers[userPosition.id],
        userPosition.details
          ? `${this.getAddress(userPosition.details)}`
          : userPosition.userName
      );
    });
    this.refreshVectorLayer();
  }

  private updateMap(userPosition: GeoPosition) {
    if (Object.keys(this.userMarkers).includes(userPosition.id)) {
      delete this.userMarkers[userPosition.id];
    }
    this.refreshVectorLayer();
  }

  private initializeMap = () => {
    //
    // Create a map with an OpenStreetMap-layer,
    // a marker layer and a view
    const attribution = new Attribution({
      // Attach the attribution information
      // to an element outside of the map
      target: 'attribution',
    });

    this.markersVectorLayer = new VectorLayer({
      source: new Vector({ features: Object.values(this.userMarkers) }),
    });
    this.map = new Map({
      controls: defaultControls({ attribution: false }).extend([attribution]),
      target: 'map',
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: this.zoomLevelSingleMarker,
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.markersVectorLayer,
      ],
    });

    this.map.getView().on('change:resolution', (e) => this.zoomInput.next(e));
  };
}
