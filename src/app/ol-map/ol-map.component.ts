import { Component, DestroyRef, inject, Input } from '@angular/core';
import { MousePositionComponent } from '../components/mouse-position/mouse-position.component';
import { ScalelineComponent } from '../components/scaleline/scaleline.component';
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
import { GeoPosition } from '../view-models/geoPosition';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { MapDataService } from '../../services/mapDataService';
import { MapInput } from '../models/mapInput';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { Attribution, defaults as defaultControls } from 'ol/control';
import { Point } from 'ol/geom';
import { ObjectEvent } from 'ol/Object';
import { GeolocationService } from '../../services/geoLocationService';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-map',
  imports: [
    CommonModule,
    MousePositionComponent,
    ScalelineComponent,
    OlMapComponent,
  ],
  templateUrl: './ol-map.component.html',
  styleUrl: './ol-map.component.scss',
})
export class MapComponent {
  @Input()
  set coordinatesChange(coords: GeolocationCoordinates | null) {
    const input = new MapInput();
    if (this.userPos && coords?.latitude && coords?.longitude) {
      input.userPos = {
        ...this.userPos,
        lat: coords.latitude,
        lng: coords.longitude,
      };
      this.logMessage = this.logMessage.concat(
        `coordinates changes ${input.userPos.lat}/${input.userPos.lng}\n`
      );
      this.mapDataService.addNewMapInput(input);
    }
  }

  map: Map | null = null;
  logMessage: string = '';

  private zoomLevelSingleMarker: number = 14;
  private userMarker: Feature = new Feature();
  private userPos: GeoPosition | null = null;
  private unsubscribe$ = new Subject();
  private zoomInput = new Subject<ObjectEvent>();
  private destroyRef = inject(DestroyRef);

  constructor(
    private readonly mapDataService: MapDataService,
    readonly geolocation$: GeolocationService
  ) {
    this.zoomInput
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.onViewChanged();
      });
  }

  ngOnInit() {
    this.geolocation$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (position) => {
        if (!this.map) {
          this.initializeMap();
        }
        if (!this.userPos) {
          const input = new MapInput();
          input.userPos = {
            id: 1,
            info: 'wira',
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            center: [0, 0],
            zoom: this.zoomLevelSingleMarker,
          };
          this.mapDataService.addNewMapInput(input);
        }
      },
    });
  }

  ngAfterViewInit(): void {
    this.mapDataService.mapInput$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((value: MapInput | null) => {
        if (value) {
          this.setupMap(value);
        }
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next(undefined);
    this.unsubscribe$.complete();
  }

  private setupMap(input: MapInput) {
    this.userPos = input.userPos;

    const view = this.map?.getView();
    if (this.userPos && this.userPos.lat && this.userPos.lng) {
      view?.setCenter(fromLonLat([this.userPos.lng, this.userPos.lat]));
    }
    view?.setZoom(this.zoomLevelSingleMarker);

    this.userPos && this.updateUserMarker(this.userPos);
  }

  private updateUserMarker(userPos: GeoPosition) {
    this.userPos = userPos;
    this.userMarker.setGeometry(undefined);
    if (!userPos) return;
    this.userMarker.setGeometry(
      new Point(fromLonLat([userPos.lng, userPos.lat]))
    );
    console.log([userPos.lng, userPos.lat]);
    this.styleUser(this.userMarker);
    // Add next line to keep chard at place and marker moving.
    // this.map?.getView().setCenter(this.userPos.center);
  }

  private styleUser = (feature: Feature) => {
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
      })
    );
  };

  private onViewChanged = () => {
    const view = this.map?.getView();
    this.zoomLevelSingleMarker = view?.getZoom() || 13;
    console.log('zoom', view);
  };

  private onCenterCanged = (e: ObjectEvent) => {
    console.log('onCenter', this.userPos);
    const input = new MapInput();
    if (!this.userPos) {
      console.log('warning something wrong with intialization userPos');
      input.userPos = {
        id: 1,
        info: 'wira',
        lat: 0,
        lng: 0,
        center: (e.target as View).getCenter(),
        zoom: this.zoomLevelSingleMarker,
      };
    } else {
      input.userPos = {
        ...this.userPos,
        center: (e.target as View).getCenter(),
      };
    }
    this.mapDataService.addNewMapInput(input);
  };

  private initializeMap = () => {
    this.userMarker = new Feature();
    //
    // Create a map with an OpenStreetMap-layer,
    // a marker layer and a view
    var attribution = new Attribution({
      // Attach the attribution information
      // to an element outside of the map
      target: 'attribution',
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
        new VectorLayer({
          source: new Vector({ features: [this.userMarker] }),
        }),
      ],
    });
    this.map.getView().on('change:resolution', (e) => this.zoomInput.next(e));
    this.map.getView().once('change:center', (e) => this.onCenterCanged(e));
  };
}
