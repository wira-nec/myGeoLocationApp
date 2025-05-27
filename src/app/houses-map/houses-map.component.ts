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
import {
  DataStoreService,
  getAddress,
  StoreData,
} from '../../services/data-store.service';
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
import {
  geocoderCreator,
  requestLocation,
  geocodeHandlingFinished,
} from '../helpers/geocoderCreator';
import { UserMarkers } from '../helpers/userMarkers';
import { ToasterService } from '../../services/toaster.service';
import { filter, takeWhile } from 'rxjs';
import { ProgressService } from '../../services/progress.service';
import { PROGRESS_ID } from '../houses/bottom-file-selection-sheet/bottom-file-selection-sheet.component';

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

  private readonly destroyRef: DestroyRef;
  private readonly fileImportControl = new ImportFilesControl();
  private readonly exportFileControl = new ExportControl();
  private readonly markers = inject(UserMarkers);

  constructor(
    private readonly userPositionService: UserPositionService,
    private readonly dataStoreService: DataStoreService,
    private readonly pictureStore: LoadPictureService,
    private readonly toaster: ToasterService,
    private readonly progressService: ProgressService
  ) {
    this.destroyRef = inject(DestroyRef);
  }

  ngOnInit(): void {
    this.initializeMap();
  }

  ngAfterViewInit(): void {
    const userPositionSubscription = this.userPositionService.userPositions$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((userPositions) => !!userPositions.length)
      )
      .subscribe((userPositions) => {
        this.markers.setupMap(userPositions, this.map.getView());
      });
    this.progressService.progress$
      .pipe(
        takeWhile(
          (progress) =>
            !progress[PROGRESS_ID] || progress[PROGRESS_ID].value !== 100,
          true
        ),
        filter(
          (progress) =>
            Object.keys(progress).length > 0 && !!progress[PROGRESS_ID]
        )
      )
      .subscribe((progress) => {
        if (progress[PROGRESS_ID].value === 100) {
          geocodeHandlingFinished();
        }
      });
    const dataStoreServiceSubscription = this.dataStoreService.dataStore$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((data) => !!data.length)
      )
      .subscribe((data) => {
        let longitude = 0;
        let latitude = 0;
        const errorMessage: string[] = [];
        this.progressService.setMaxCount(PROGRESS_ID, data.length);
        data.forEach((data) => {
          if (this.dataContainsLocation(data)) {
            longitude = Number(data[LONGITUDE]);
            latitude = Number(data[LATITUDE]);
            this.userPositionService.updateUserPosition(
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
            this.progressService.increaseProgressByStep(PROGRESS_ID);
          } else {
            const [postcode, city, houseNumber, street] = getAddress(data);
            const userPos = this.userPositionService.getUserByAddress(
              city,
              postcode,
              houseNumber,
              street
            );
            if (userPos) {
              // Is data for existing userPosition,
              // only update the userPosition data,
              // location is already requested on creation.
              this.userPositionService.updateUserPosition(
                0,
                0,
                userPos.userName,
                data,
                userPos.userPositionInfo
              );
              this.progressService.increaseProgressByStep(PROGRESS_ID);
            } else {
              try {
                requestLocation(data);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (e) {
                errorMessage.push(`${postcode}, ${houseNumber}, ${city}`);
              }
            }
          }
        });
        if (longitude && latitude) {
          // Give it some time to process last userPosition update
          // before moving the map
          setTimeout(() => {
            this.map.getView().animate({
              center: fromLonLat([longitude, latitude]),
              zoom: this.markers.zoomLevelSingleMarker,
            });
          }, 1000);
        }
        if (errorMessage.length) {
          this.toaster.show(
            'error',
            `${errorMessage.length} location request(s) failed for following address(es)`,
            errorMessage,
            600000
          );
        }
      });
    this.destroyRef.onDestroy(() => {
      userPositionSubscription.unsubscribe();
      dataStoreServiceSubscription.unsubscribe();
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
        this.userPositionService,
        this.toaster,
        this.progressService
      )
    );

    return this.map;
  };

  private dataContainsLocation(data: StoreData) {
    return Object.keys(data).some(
      (key) => COORDINATE_KEYS.includes(key) && !!data[key]
    );
  }
}
