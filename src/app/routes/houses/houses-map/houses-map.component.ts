import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  DestroyRef,
  Renderer2,
  effect,
} from '@angular/core';
import Map from 'ol/Map';
import { OlMapComponent } from '../../../shared/map/map.component';
import { View } from 'ol';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OSM } from 'ol/source';
import { GeoPositionService } from '../../../core/services/geo-position.service';
import {
  DataStoreService,
  getAddress,
  StoreData,
} from '../../../core/services/data-store.service';
import { Attribution, defaults as defaultControls } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import { PopupHouseCardComponent } from '../popup-house-card/popup-house-card.component';
import { ImportFilesControl } from '../controls/importFilesControl/importFilesControl';
import { ExportControl } from '../controls/exportControl/export-control';
import { LoadPictureService } from '../../../core/services/load-picture.service';
import {
  COORDINATE_KEYS,
  FIRST_NAME,
  imagesFilter,
  INFO,
  LATITUDE,
  LONGITUDE,
} from '../../../core/services/data-store.service';
import { Markers } from '../providers/markers';
import { ToasterService } from '../../../core/services/toaster.service';
import { filter, takeWhile } from 'rxjs';
import {
  ProgressService,
  XSL_IMPORT_PROGRESS_ID,
} from '../../../core/services/progress.service';
import { CenterControl } from '../controls/centerControl/center-control';
import { TooltipInfoComponentComponent } from '../tooltip-info-component/tooltip-info-component.component';
import { SearchControl } from '../controls/searchControl/search-control';
import { GeoCoderService } from '../../../core/services/geo-coder.service';
import { SearchInputService } from '../../../core/services/search-input.service';
import { EditExcelControl } from '../controls/edit-excel-control/edit-excel-control.component';
import { MapEventHandlers } from '../providers/mapEventHandlers';
import { BasicEventHandlers } from '../providers/basicEventHandler';

@Component({
  selector: 'app-houses-map',
  standalone: true,
  imports: [
    PopupHouseCardComponent,
    OlMapComponent,
    TooltipInfoComponentComponent,
  ],
  templateUrl: './houses-map.component.html',
  styleUrl: './houses-map.component.scss',
  providers: [
    Markers,
    GeoCoderService,
    MapEventHandlers,
    {
      provide: MapEventHandlers,
      useExisting: BasicEventHandlers,
    },
  ],
})
export class HousesMapComponent implements OnInit, AfterViewInit {
  map!: Map;

  private readonly destroyRef: DestroyRef;
  private readonly fileImportControl = new ImportFilesControl();
  private readonly exportFileControl = new ExportControl();
  private readonly centerControl = new CenterControl();
  private readonly searchControl = new SearchControl({
    callback: () => this.showSearchControl(),
  });
  private readonly editExcelControl = new EditExcelControl({
    callback: (evt: Event) => this.showExcelGrid(evt),
  });
  private readonly markers = inject(Markers);
  private readonly geoCoderService = inject(GeoCoderService);

  constructor(
    private readonly geoPositionService: GeoPositionService,
    private readonly dataStoreService: DataStoreService,
    private readonly pictureStore: LoadPictureService,
    private readonly toaster: ToasterService,
    private readonly progressService: ProgressService,
    private readonly renderer: Renderer2,
    private readonly searchInputService: SearchInputService,
    private readonly mapEventHandlers: MapEventHandlers
  ) {
    this.destroyRef = inject(DestroyRef);
    effect(() => {
      this.renderer.addClass(
        document.getElementsByClassName('ol-geocoder')[0],
        this.searchInputService.getVisibility() ? 'visible' : 'hidden'
      );
    });
  }

  ngOnInit(): void {
    this.initializeMap();
  }

  ngAfterViewInit(): void {
    const geoPositionSubscription = this.geoPositionService.geoPositions$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((geoPositions) => !!geoPositions.length)
      )
      .subscribe((geoPositions) => {
        this.markers.setupMap(geoPositions, this.map.getView());
      });
    this.progressService
      .getProgress()
      .pipe(
        takeWhile(
          (progress) =>
            !progress[XSL_IMPORT_PROGRESS_ID] ||
            progress[XSL_IMPORT_PROGRESS_ID].value !== 100,
          true
        ),
        filter(
          (progress) =>
            Object.keys(progress).length > 0 &&
            !!progress[XSL_IMPORT_PROGRESS_ID]
        )
      )
      .subscribe((progress) => {
        if (progress[XSL_IMPORT_PROGRESS_ID].value === 100) {
          this.geoCoderService.geocodeHandlingFinished();
        }
      });
    const dataStoreServiceSubscription = this.dataStoreService.dataStore$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((data) => !!data.length)
      )
      .subscribe(async (data) => {
        let longitude = 0;
        let latitude = 0;
        const errorMessage: string[] = [];
        this.progressService.setMaxCount(XSL_IMPORT_PROGRESS_ID, data.length);
        // use for loop because of async function, which will not wait in a foreach
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let index = 0; index < data.length; index++) {
          const item = data[index];
          if (this.dataContainsLocation(item)) {
            longitude = Number(item[LONGITUDE]);
            latitude = Number(item[LATITUDE]);
            this.geoPositionService.updateGeoPosition(
              longitude,
              latitude,
              item[FIRST_NAME],
              item,
              item[INFO]
            );
            const pictureColumns = Object.keys(item).filter((columnName) =>
              imagesFilter(columnName)
            );
            pictureColumns.forEach((columnName) =>
              this.pictureStore.storePicture(item[columnName], columnName)
            );
            await this.progressService.increaseProgressByStep(
              XSL_IMPORT_PROGRESS_ID
            );
          } else {
            const [street, houseNumber, city, postcode] = getAddress(item);
            const geoPos = this.geoPositionService.getGeoPositionByAddress(
              city,
              postcode,
              houseNumber,
              street
            );
            if (geoPos) {
              // Is data for existing geoPosition,
              // only update the geoPosition data,
              // location is already requested on creation.
              this.geoPositionService.updateGeoPosition(
                0,
                0,
                geoPos.userName,
                item,
                geoPos.geoPositionInfo
              );
              await this.progressService.increaseProgressByStep(
                XSL_IMPORT_PROGRESS_ID
              );
            } else {
              try {
                this.geoCoderService.requestLocation(item);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (e) {
                errorMessage.push(`${postcode}, ${houseNumber}, ${city}`);
              }
            }
          }
        }
        if (longitude && latitude) {
          // Give it some time to process last geoPosition update
          // before moving the map
          setTimeout(() => {
            this.map.getView().animate({
              center: fromLonLat([5.4808, 52.2211]),
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
      geoPositionSubscription.unsubscribe();
      dataStoreServiceSubscription.unsubscribe();
    });
  }

  private showSearchControl() {
    this.searchInputService.toggleVisibility();
    const inputElement = document.getElementById(
      'gcd-input-query'
    ) as HTMLInputElement | null;
    if (inputElement) {
      inputElement.value = '';
    }
  }

  private showExcelGrid(evt: Event) {
    evt.stopPropagation();
    this.dataStoreService.setSelectedData(undefined);
    this.dataStoreService.setEditMode(true);
    this.mapEventHandlers.closePopup();
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
        this.centerControl,
        this.searchControl,
        this.editExcelControl,
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

    this.markers.initializeMarkers(this.map);
    this.map.addControl(
      this.geoCoderService.geocoderCreator(
        this.map,
        this.markers.zoomLevelSingleMarker
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
