import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  DestroyRef,
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
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ImportFilesControl } from '../mapControls/importFilesControl/importFilesControl';
import { BottomFileSelectionSheetComponent } from '../houses/bottom-file-selection-sheet/bottom-file-selection-sheet.component';
import { ExportControl } from '../mapControls/exportControl/export-control';
import { ExcelService } from '../../services/excel.service';
import { LoadPictureService } from '../../services/load-picture.service';
import {
  COORDINATE_KEYS,
  imagesFilter,
  INFO,
  LATITUDE,
  LONGITUDE,
} from '../helpers/dataManipulations';
import { JsonCreatorService } from '../../services/json-creator.service';

@Component({
  selector: 'app-houses-map',
  standalone: true,
  imports: [PopupHouseCardComponent, OlMapComponent],
  templateUrl: './houses-map.component.html',
  styleUrl: './houses-map.component.scss',
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
  private _bottomSheet = inject(MatBottomSheet);
  private readonly fileImportControl = new ImportFilesControl({
    callback: this._bottomSheet,
  });
  private readonly exportFileControl!: ExportControl;

  constructor(
    private readonly userPositionService: UserPositionService,
    private readonly dataStoreService: DataStoreService,
    private readonly excelService: ExcelService,
    private readonly pictureStore: LoadPictureService,
    private readonly jsonCreatorService: JsonCreatorService
  ) {
    this.zoomInput
      .pipe(takeUntilDestroyed())
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.onViewChanged();
      });
    this.exportFileControl = new ExportControl({
      callback: () => {
        if (dataStoreService.getDataStoreSize() > 0) {
          const dataStore = dataStoreService.getStore();
          const sheet = dataStore.map((data) => {
            const userPos = userPositionService.getUserByAddress(
              data['city'],
              data['postcode'],
              data['housenumber'].toString()
            );
            if (userPos) {
              /*
              const imageNames = getImageNames(data);
              const images = {};
              imageNames.forEach((imageName) => {
                const imageColumn = Object.entries(data).find(
                  ([, value]) => value === imageName
                );
                if (imageColumn) {
                  Object.assign(images, {
                    [imageColumn[0]]: pictureStore.getPicture(imageName),
                  });
                }
              });
              */
              return {
                ...data,
                longitude: userPos.coords.longitude.toString(),
                latitude: userPos.coords.latitude.toString(),
                userPositionInfo: userPos.info,
                // ...images,
              };
            } else {
              return data;
            }
          });
          excelService.generateExcel(sheet, 'exportedMap.xls');
          jsonCreatorService.savaJsonFile(
            jsonCreatorService.createJson(this.pictureStore.getPicturesStore()),
            'exportedMap.json'
          );
        }
      },
    });
  }

  ngOnInit(): void {
    if (!this.map) {
      const map = this.initializeMap();
      this.geocoder = new olGeocoder('nominatim', {
        provider: 'photon',
        placeholder: 'Search for ...',
        targetType: 'text-input',
        limit: 1,
        keepOpen: true,
        target: document.body,
        preventDefault: true,
      });
      map.addControl(this.geocoder);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.geocoder.on('addresschosen', (evt: any) => {
        const originalDetails = evt.address.original.details;
        const storeData = this.dataStoreService.get({
          postcode: originalDetails.postcode,
          housenumber: evt.address.original.details.housenumber,
          city: originalDetails.city,
        });
        console.log('street map found', originalDetails);
        this.createUserPosition(
          evt.place.lon,
          evt.place.lat,
          storeData,
          JSON.stringify(originalDetails)
        );
        if (
          this.userPositionService.getNumberOfUsers() >=
          this.dataStoreService.getDataStoreSize()
        ) {
          map.getView().animate({
            center: fromLonLat([evt.place.lon, evt.place.lat]),
            zoom: this.zoomLevelSingleMarker,
          });
        }
      });
    }
  }

  private createUserPosition(
    longitude: number,
    latitude: number,
    storeData: StoreData | undefined,
    info: string
  ) {
    this.userPositionService.addUserPosition([
      {
        coords: {
          altitude: 0,
          longitude,
          accuracy: 0,
          altitudeAccuracy: null,
          heading: null,
          latitude,
          speed: null,
          toJSON: function () {
            throw new Error('Function not implemented.');
          },
        },
        id: uuidv4(),
        userName: storeData ? storeData['firstName'] : 'Unknown',
        info,
        zoom: 0,
        details: storeData,
      },
    ]);
  }

  ngAfterViewInit(): void {
    this._bottomSheet.open(BottomFileSelectionSheetComponent);
    this.textInput = document.querySelector('.gcd-txt-input');
    this.sendTextInput = document.querySelector('.gcd-txt-search');
    this.userPositionService.userPositions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((userPositions) => {
        if (userPositions.length) {
          this.setupMap(userPositions);
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
      let longitude = 0;
      let latitude = 0;
      data.forEach((data) => {
        if (
          Object.keys(data).filter((key) => COORDINATE_KEYS.includes(key))
            .length
        ) {
          longitude = Number(data[LONGITUDE]);
          latitude = Number(data[LATITUDE]);
          this.createUserPosition(longitude, latitude, data, data[INFO]);
          const pictureColumns = Object.keys(data).filter((columnName) =>
            imagesFilter(columnName)
          );
          pictureColumns.forEach((columnName) =>
            this.pictureStore.storePicture(data[columnName], columnName)
          );
        } else {
          if (this.textInput && this.sendTextInput) {
            this.textInput.value = this.getAddress(data);
            console.log('search street map for', this.textInput.value);
            this.sendTextInput.click();
          }
        }
        if (longitude && latitude) {
          this.map?.getView().animate({
            center: fromLonLat([longitude, latitude]),
            zoom: this.zoomLevelSingleMarker,
          });
        }
      });
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
    if (this.zoomLevelSingleMarker > 15.5) {
      feature.setStyle(this.getHouseStyle(labelText));
    } else {
      feature.setStyle(this.getDotStyle(4));
    }
  };

  private getHouseStyle(labelText: string): StyleLike | undefined {
    return new Style({
      image: new Icon({
        src: 'assets/icons8-house-30.png',
        size: [50, 50],
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

  private getDotStyle(radius: number): StyleLike | undefined {
    return new Style({
      image: new CircleStyle({
        radius: radius,
        fill: new Fill({ color: 'black' }),
        stroke: new Stroke({
          color: 'white',
          width: 2,
        }),
      }),
    });
  }

  private updateUserMarkerStyle() {
    Object.keys(this.userMarkers).forEach((key) => {
      const userPos = this.userPositionService.getUserPosition(key);
      let labelText = '';
      if (userPos?.details) {
        labelText = this.getAddress(userPos.details);
      } else {
        labelText = userPos?.userName || 'Unknown';
      }
      this.styleUser(this.userMarkers[key], labelText);
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
      controls: defaultControls({ attribution: false }).extend([
        attribution,
        this.fileImportControl,
        this.exportFileControl,
      ]),
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
    return this.map;
  };
}
