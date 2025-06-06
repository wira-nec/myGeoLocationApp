import Feature from 'ol/Feature';
import { StyleLike } from 'ol/style/Style';
import { Fill, Icon, Text, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { getAddress } from '../../../core/services/data-store.service';
import { Geometry, Point } from 'ol/geom';
import { GeoPositionService } from '../../../core/services/geo-position.service';
import { GeoPosition } from '../../../shared/view-models/geoPosition';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { getUid } from 'ol/util';
import { Injectable } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { ObjectEvent } from 'ol/Object';
import Map from 'ol/Map';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';

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

@Injectable()
export class Markers {
  private zoomInput = new Subject<ObjectEvent>();
  public zoomLevelSingleMarker = 11;
  private markers: Record<string, Feature> = {};
  private markersVectorLayer = new VectorLayer<
    Vector<Feature<Geometry>>,
    Feature<Geometry>
  >();
  private map!: Map;

  constructor(private readonly geoPositionService: GeoPositionService) {
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

  public updateMarkerStyle() {
    Object.keys(this.markers).forEach((key) => {
      const geoPos = this.geoPositionService.getGeoPosition(key);
      const labelText = this.getAddressLabel(
        geoPos,
        geoPos?.userName || 'Unknown'
      );
      style(this.markers[key], labelText, this.zoomLevelSingleMarker);
      this.markers[key].changed();
    });
    this.refreshVectorLayer();
  }

  private getAddressLabel(
    geoPos: GeoPosition | undefined,
    defaultText: string
  ) {
    if (geoPos?.details) {
      const [street, houseNumber, city, postcode] = getAddress(geoPos.details);
      return `${
        street?.length ? street + ' ' : ''
      }${houseNumber} ${city}, ${postcode}`;
    }
    return defaultText;
  }

  public setupMap(geoPositions: GeoPosition[], view: View) {
    view?.setZoom(this.zoomLevelSingleMarker);
    geoPositions.forEach((geoPosition) => {
      if (!Object.keys(this.markers).includes(geoPosition.id)) {
        this.markers[geoPosition.id] = new Feature<Geometry>();
        this.geoPositionService.setGeoPositionIdUid(
          geoPosition.id,
          getUid(this.markers[geoPosition.id])
        );
      }
      const coords = [
        geoPosition.coords.longitude,
        geoPosition.coords.latitude,
      ];
      this.markers[geoPosition.id].setGeometry(new Point(fromLonLat(coords)));
      style(
        this.markers[geoPosition.id],
        this.getAddressLabel(geoPosition, geoPosition.userName),
        this.zoomLevelSingleMarker
      );
    });
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
