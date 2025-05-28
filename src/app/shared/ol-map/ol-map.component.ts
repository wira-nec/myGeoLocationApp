import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { MousePositionComponent } from '../mouse-position/mouse-position.component';
import { ScaleLineComponent } from '../scale-line/scaleLine.component';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { CommonModule } from '@angular/common';
import { OlMapComponent } from '../map/map.component';
import { debounceTime, Subject } from 'rxjs';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text.js';
import { Attribution, defaults as defaultControls } from 'ol/control';
import { Geometry, Point } from 'ol/geom';
import { ObjectEvent } from 'ol/Object';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GeoPositionService } from '../../core/services/geo-position.service';
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
  set coordinatesChange(geoPosition: GeoPosition) {
    const geoPos = this.geoPositionService.getGeoPosition(geoPosition.id);
    if (geoPos) {
      if (geoPosition.coords.latitude && geoPosition.coords.longitude) {
        this.geoPositionService.setGeoCoordinatesAndOrZoom(
          geoPos.id,
          geoPosition.coords,
          this.zoomLevelSingleMarker
        );
        this.logMessage = this.logMessage.concat(
          `coordinates changes for user "${geoPos.userName}" to ${geoPosition.coords.latitude}/${geoPosition.coords.longitude}\n`
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

  constructor(private readonly geoPositionService: GeoPositionService) {
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
    const geoPositionSubscription = this.geoPositionService.geoPositions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((geoPositions) => {
        if (geoPositions) {
          this.setupMap(geoPositions);
        }
      });
    const removeGeoPositionSubscription =
      this.geoPositionService.removedGeoPosition$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((removedGeoPosition) => {
          if (removedGeoPosition) {
            this.updateMap(removedGeoPosition);
          }
        });
    this.destroyRef.onDestroy(() => {
      geoPositionSubscription.unsubscribe();
      removeGeoPositionSubscription.unsubscribe();
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
    const input = this.geoPositionService.getGeoPosition(this.userId);
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

  private setupMap(geoPositions: GeoPosition[]) {
    const view = this.map?.getView();
    view?.setZoom(this.zoomLevelSingleMarker);
    geoPositions.forEach((geoPosition) => {
      if (!Object.keys(this.userMarkers).includes(geoPosition.id)) {
        this.userMarkers[geoPosition.id] = new Feature<Geometry>();
      }
      const coords = [
        geoPosition.coords.longitude,
        geoPosition.coords.latitude,
      ];
      this.userMarkers[geoPosition.id].setGeometry(
        new Point(fromLonLat(coords))
      );
      this.styleUser(this.userMarkers[geoPosition.id], geoPosition.userName);
      if (
        geoPosition.id === this.userId &&
        geoPosition.coords.latitude &&
        geoPosition.coords.longitude
      ) {
        view?.setCenter(fromLonLat(coords));
      }
    });
    this.refreshVectorLayer();
  }

  private updateMap(geoPosition: GeoPosition) {
    if (Object.keys(this.userMarkers).includes(geoPosition.id)) {
      delete this.userMarkers[geoPosition.id];
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
