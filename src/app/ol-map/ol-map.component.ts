import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { MousePositionComponent } from '../components/mouse-position/mouse-position.component';
import { ScaleLineComponent } from '../components/scale-line/scaleLine.component';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { CommonModule } from '@angular/common';
import { OlMapComponent } from '../components/map/map.component';
import { debounceTime, Subject } from 'rxjs';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text.js';
import { Attribution, defaults as defaultControls } from 'ol/control';
import { Geometry, Point } from 'ol/geom';
import { ObjectEvent } from 'ol/Object';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserPositionService } from '../../services/user-position.service';
import { GeoPosition } from '../view-models/geoPosition';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    MousePositionComponent,
    ScaleLineComponent,
    OlMapComponent,
  ],
  templateUrl: './ol-map.component.html',
  styleUrl: './ol-map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @Input({ required: false }) extendedView = true;
  @Input() userId!: string;
  @Input()
  set coordinatesChange(userPosition: GeoPosition) {
    const userPos = this.userPositionService.getUserPosition(userPosition.id);
    if (userPos) {
      if (userPosition.coords.latitude && userPosition.coords.longitude) {
        this.userPositionService.setUserCoordinatesAndOrZoom(
          userPos.id,
          userPosition.coords,
          this.zoomLevelSingleMarker
        );
        this.logMessage = this.logMessage.concat(
          `coordinates changes for user "${userPos.userName}" to ${userPosition.coords.latitude}/${userPosition.coords.longitude}\n`
        );
      }
    }
  }

  map: Map | null = null;
  logMessage = '';

  private canvasStyleIsSet = false;
  private zoomLevelSingleMarker = 13;
  private userMarkers: Record<string, Feature> = {};
  private readonly destroyRef = inject(DestroyRef);
  private zoomInput = new Subject<ObjectEvent>();
  private markersVectorLayer = new VectorLayer<
    Vector<Feature<Geometry>>,
    Feature<Geometry>
  >();

  constructor(private readonly userPositionService: UserPositionService) {
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
    }
  }

  ngAfterViewInit(): void {
    const userPositionSubscription = this.userPositionService.userPositions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((userPositions) => {
        if (userPositions) {
          this.setupMap(userPositions);
        }
      });
    const removeUserPositionSubscription =
      this.userPositionService.removedUserPosition$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((removedUserPosition) => {
          if (removedUserPosition) {
            this.updateMap(removedUserPosition);
          }
        });
    this.destroyRef.onDestroy(() => {
      userPositionSubscription.unsubscribe();
      removeUserPositionSubscription.unsubscribe();
    });
  }

  ngAfterViewChecked(): void {
    if (!this.extendedView && !this.canvasStyleIsSet) {
      const canvas = this.map?.getViewport().querySelector('canvas');
      if (canvas) {
        canvas.style.borderRadius = '50%';
        this.canvasStyleIsSet = true;
      }
    }
  }

  private onViewChanged = () => {
    const view = this.map?.getView();
    this.zoomLevelSingleMarker = view?.getZoom() || 13;
  };

  private onCenterChanged = (e: ObjectEvent) => {
    const input = this.userPositionService.getUserPosition(this.userId);
    if (input && input.id === this.userId) {
      input.center = (e.target as View).getCenter();
    }
  };

  private refreshVectorLayer() {
    const vectorLayerSource = this.markersVectorLayer.getSource();
    if (vectorLayerSource) {
      vectorLayerSource.clear(true);
      vectorLayerSource.addFeatures(Object.values(this.userMarkers));
    }
  }

  private styleUser = (feature: Feature, userName: string) => {
    if (!feature) return;

    feature.setStyle(
      new Style({
        image: new Icon({
          src: 'assets/position_marker.png',
          size: [60, 60],
          anchor: [0.5, 1],
          opacity: 0.7,
          scale: 0.5,
        }),
        text: new Text({
          text: userName,
          font: 'bold 12px Calibri,sans-serif',
          offsetY: -40,
          fill: new Fill({
            color: 'blue',
          }),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      })
    );
  };

  private setupMap(userPositions: GeoPosition[]) {
    const view = this.map?.getView();
    view?.setZoom(this.zoomLevelSingleMarker);
    userPositions.forEach((userPosition) => {
      if (!Object.keys(this.userMarkers).includes(userPosition.id)) {
        this.userMarkers[userPosition.id] = new Feature<Geometry>();
      }
      const coords = [
        userPosition.coords.longitude,
        userPosition.coords.latitude,
      ];
      this.userMarkers[userPosition.id].setGeometry(
        new Point(fromLonLat(coords))
      );
      this.styleUser(this.userMarkers[userPosition.id], userPosition.userName);
      if (
        userPosition.id === this.userId &&
        userPosition.coords.latitude &&
        userPosition.coords.longitude
      ) {
        view?.setCenter(fromLonLat(coords));
      }
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
    this.userMarkers[this.userId] = new Feature<Geometry>();
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
    this.map.getView().once('change:center', (e) => this.onCenterChanged(e));
  };
}
