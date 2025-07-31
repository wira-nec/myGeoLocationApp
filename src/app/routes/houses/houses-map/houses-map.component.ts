import { Component, OnInit, Renderer2, effect } from '@angular/core';
import Map from 'ol/Map';
import { OlMapComponent } from '../../../shared/map/map.component';
import { View } from 'ol';
import { OSM } from 'ol/source';
import { DataStoreService } from '../../../core/services/data-store.service';
import { Attribution, defaults as defaultControls } from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import { fromLonLat } from 'ol/proj';
import { PopupHouseCardComponent } from '../popup-house-card/popup-house-card.component';
import { ImportFilesControl } from '../controls/importFilesControl/importFilesControl';
import { ExportControl } from '../controls/exportControl/export-control';
import { Markers } from '../providers/markers';
import { CenterControl } from '../controls/centerControl/center-control';
import { TooltipInfoComponentComponent } from '../tooltip-info-component/tooltip-info-component.component';
import { SearchControl } from '../controls/searchControl/search-control';
import { GeoCoderService } from '../../../core/services/geo-coder.service';
import { SearchInputService } from '../../../core/services/search-input.service';
import { EditExcelControl } from '../controls/edit-excel-control/edit-excel-control.component';
import { MapEventHandlers } from '../providers/mapEventHandlers';

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
})
export class HousesMapComponent implements OnInit {
  map!: Map;

  private readonly fileImportControl = new ImportFilesControl();
  private readonly exportFileControl = new ExportControl();
  private readonly centerControl = new CenterControl();
  private readonly searchControl = new SearchControl({
    callback: () => this.showSearchControl(),
  });
  private readonly editExcelControl = new EditExcelControl({
    callback: (evt: Event) => this.showExcelGrid(evt),
  });

  constructor(
    private readonly dataStoreService: DataStoreService,
    private readonly renderer: Renderer2,
    private readonly searchInputService: SearchInputService,
    private readonly mapEventHandlers: MapEventHandlers,
    private readonly markers: Markers,
    private readonly geoCoderService: GeoCoderService
  ) {
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
      this.geoCoderService.showLoadingSpinner(true);
    });
    this.map.on('loadend', () => {
      this.geoCoderService.showLoadingSpinner(false);
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
}
