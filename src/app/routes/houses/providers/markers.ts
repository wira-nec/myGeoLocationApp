import Feature from 'ol/Feature';
import { StyleLike } from 'ol/style/Style';
import { Fill, Icon, Text, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { Geometry, Point } from 'ol/geom';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { Injectable } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { ObjectEvent } from 'ol/Object';
import Map from 'ol/Map';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';
import { Coordinate } from 'ol/coordinate';

export const SEARCH_FOR_MARKER_ID = 'searchedFor';
export const STORE_DATA_ID_PROPERTY = 'StoreDataId';
export const ADDRESS_PROPERTY = 'Address';
export const GEO_INFORMATION_PROPERTY = 'GeoInformation';

const style = (
  feature: Feature,
  labelText: string,
  zoomLevelSingleMarker: number
) => {
  if (!feature) return;
  if (zoomLevelSingleMarker > 14) {
    feature.setStyle(getHouseStyle(labelText));
  } else {
    feature.setStyle(getDotStyle(4, labelText === 'Unknown'));
  }
  feature.setProperties({ Address: labelText });
};

const getHouseStyle = (labelText: string): StyleLike | undefined => {
  return new Style({
    image: new Icon({
      src: 'assets/icons8-house-48.png',
      size: [48, 48],
      anchor: [0.5, 48],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.7,
      scale: 0.5,
    }),
    text: new Text({
      text: labelText,
      font: 'bold 12px Calibri,sans-serif',
      offsetY: -29,
      fill: new Fill({
        color: labelText === 'Unknown' ? 'red' : 'blue',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  });
};

const getDotStyle = (radius: number, isRed: boolean): StyleLike | undefined => {
  return new Style({
    image: new CircleStyle({
      radius: radius,
      fill: new Fill({ color: isRed ? 'red' : 'black' }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  });
};

const getLocatorStyle = (labelText: string): StyleLike | undefined => {
  return new Style({
    image: new Icon({
      src: 'assets/icons8-marker-50.png',
      size: [50, 50],
      anchor: [0.5, 50],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      opacity: 0.7,
      scale: 0.5,
    }),
    text: new Text({
      text: labelText,
      font: 'bold 12px Calibri,sans-serif',
      offsetY: -30,
      fill: new Fill({
        color: labelText === 'Unknown' ? 'red' : 'blue',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  });
};

@Injectable({
  providedIn: 'root',
})
export class Markers {
  private zoomInput = new Subject<ObjectEvent>();
  public zoomLevelSingleMarker = 11;
  private markers: Record<string, Feature> = {};
  private markersVectorLayer = new VectorLayer<
    Vector<Feature<Geometry>>,
    Feature<Geometry>
  >();
  private map!: Map;

  constructor() {
    this.zoomInput
      .pipe(takeUntilDestroyed())
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.onViewChanged(this.map);
      });
  }

  private refreshVectorLayer() {
    const vectorLayerSource = this.markersVectorLayer.getSource();
    if (vectorLayerSource) {
      vectorLayerSource.clear(true);
      vectorLayerSource.addFeatures(Object.values(this.markers));
    }
  }

  private updateMarkerStyle() {
    Object.keys(this.markers).forEach((key) => {
      if (key !== SEARCH_FOR_MARKER_ID) {
        const labelText = this.getAddressLabel(
          this.markers[key].get(GEO_INFORMATION_PROPERTY) as string | undefined,
          this.markers[key].get(ADDRESS_PROPERTY) || ''
        );
        style(this.markers[key], labelText, this.zoomLevelSingleMarker);
        this.markers[key].changed();
      }
    });
    this.refreshVectorLayer();
  }

  private getAddressLabel(
    geoInformation: string | undefined,
    defaultText: string
  ) {
    if (geoInformation) {
      // Assuming geoInformation is a JSON string with address information
      const [street, houseNumber, city, postcode] =
        this.getAddress(geoInformation);
      return `${
        street?.length ? street + ' ' : ''
      }${houseNumber} ${city}, ${postcode}`;
    }
    return defaultText;
  }

  private getAddress(geoInformation: string): string[] {
    const address = JSON.parse(geoInformation);
    return [
      address.street || '',
      address.houseNumber || '',
      address.city || '',
      address.postcode || '',
    ];
  }

  public setupMap(
    id: string,
    longitude: number,
    latitude: number,
    labelText: string,
    geoInformation: string,
    view: View
  ) {
    view?.setZoom(this.zoomLevelSingleMarker);
    if (!Object.keys(this.markers).includes(id)) {
      this.markers[id] = new Feature<Geometry>();
      this.markers[id].set(STORE_DATA_ID_PROPERTY, id);
    }
    this.markers[id].setProperties({
      [ADDRESS_PROPERTY]: labelText,
      [GEO_INFORMATION_PROPERTY]: geoInformation,
    });
    const coords = [longitude, latitude];
    this.markers[id].setGeometry(new Point(fromLonLat(coords)));
    style(
      this.markers[id],
      this.getAddressLabel(geoInformation, labelText),
      this.zoomLevelSingleMarker
    );
    this.refreshVectorLayer();
  }

  public addMarker(id: string | number, coords: Coordinate, address: string) {
    this.markers[id] = new Feature<Geometry>();
    this.markers[id].setId(id);
    this.markers[id].set(ADDRESS_PROPERTY, address);
    this.markers[id].setGeometry(new Point(fromLonLat(coords)));
    this.markers[id].setStyle(getLocatorStyle(address));
    this.refreshVectorLayer();
  }

  private onViewChanged(map: Map) {
    const view = map.getView();
    this.zoomLevelSingleMarker = view?.getZoom() || 11;
    this.updateMarkerStyle();
    console.log('zoom', this.zoomLevelSingleMarker);
  }

  public initializeMarkers(map: Map) {
    this.map = map;
    this.markersVectorLayer = new VectorLayer({
      source: new Vector({ features: Object.values(this.markers) }),
    });
    map.addLayer(this.markersVectorLayer);
    const view = map.getView();
    view.setZoom(this.zoomLevelSingleMarker);
    map.getView().on('change:resolution', (e) => {
      this.zoomInput.next(e);
    });
  }
}
