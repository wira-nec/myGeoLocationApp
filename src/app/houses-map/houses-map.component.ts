import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  DestroyRef,
} from '@angular/core';
import Map from 'ol/Map';
import { OlMapComponent } from '../components/map/map.component';
import { View } from 'ol';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OSM } from 'ol/source';
import { UserPositionService } from '../../services/user-position.service';
import { DataStoreService } from '../../services/data-store.service';
import { Attribution, defaults as defaultControls } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import { PopupHouseCardComponent } from '../popup-house-card/popup-house-card.component';
import { ImportFilesControl } from '../mapControls/importFilesControl/importFilesControl';
import { ExportControl } from '../mapControls/exportControl/export-control';
import { LoadPictureService } from '../../services/load-picture.service';
import {
  COORDINATE_KEYS,
  FIRST_NAME,
  imagesFilter,
  INFO,
  LATITUDE,
  LONGITUDE,
} from '../../services/data-store.service';
import { geocoderCreator, requestLocation } from '../helpers/geocoderCreator';
import { UserMarkers } from '../helpers/userMarkers';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-houses-map',
  standalone: true,
  imports: [PopupHouseCardComponent, OlMapComponent],
  templateUrl: './houses-map.component.html',
  styleUrl: './houses-map.component.scss',
  providers: [UserMarkers],
})
export class HousesMapComponent implements OnInit, AfterViewInit {
  map!: Map;

  private destroyRef = inject(DestroyRef);
  private readonly fileImportControl = new ImportFilesControl();
  private readonly exportFileControl = new ExportControl();

  constructor(
    private readonly userPositionService: UserPositionService,
    private readonly dataStoreService: DataStoreService,
    private readonly pictureStore: LoadPictureService,
    private readonly markers: UserMarkers,
    private readonly toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.initializeMap();
  }

  ngAfterViewInit(): void {
    this.userPositionService.userPositions$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((userPositions) => {
        if (userPositions.length) {
          this.markers.setupMap(userPositions, this.map.getView());
        }
      });
    this.dataStoreService.dataStore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        let longitude = 0;
        let latitude = 0;
        data.forEach((data) => {
          if (
            Object.keys(data).filter((key) => COORDINATE_KEYS.includes(key))
              .length
          ) {
            longitude = Number(data[LONGITUDE]);
            latitude = Number(data[LATITUDE]);
            this.userPositionService.createUserPosition(
              longitude,
              latitude,
              data[FIRST_NAME],
              data,
              data[INFO]
            );
            const pictureColumns = Object.keys(data).filter((columnName) =>
              imagesFilter(columnName)
            );
            pictureColumns.forEach((columnName) =>
              this.pictureStore.storePicture(data[columnName], columnName)
            );
          } else {
            try {
              requestLocation(data);
            } catch (e) {
              this.toaster.show(
                'error',
                'Location request failed',
                (e as Error).message,
                600000
              );
            }
          }
          if (longitude && latitude) {
            this.map.getView().animate({
              center: fromLonLat([longitude, latitude]),
              zoom: this.markers.zoomLevelSingleMarker,
            });
          }
        });
      });
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

    this.map = new Map({
      controls: defaultControls({ attribution: false }).extend([
        attribution,
        this.fileImportControl,
        this.exportFileControl,
      ]),
      target: 'map',
      view: new View({
        center: fromLonLat([0, 0]),
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
    });

    this.map.on('loadstart', () => {
      this.map.getTargetElement().classList.add('spinner');
    });
    this.map.on('loadend', () => {
      this.map.getTargetElement().classList.remove('spinner');
    });

    this.markers.initializeUseMarkers(this.map);
    this.map.addControl(
      geocoderCreator(
        this.map,
        this.markers.zoomLevelSingleMarker,
        this.dataStoreService,
        this.userPositionService
      )
    );

    return this.map;
  };
}
