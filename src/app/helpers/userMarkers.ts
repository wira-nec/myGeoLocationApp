import Feature from 'ol/Feature';
import { StyleLike } from 'ol/style/Style';
import { Fill, Icon, Text, Stroke, Style } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { getAddress } from '../../services/data-store.service';
import { Geometry, Point } from 'ol/geom';
import { UserPositionService } from '../../services/user-position.service';
import { GeoPosition } from '../view-models/geoPosition';
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

const styleUser = (
  feature: Feature,
  labelText: string,
  zoomLevelSingleMarker: number
) => {
  if (!feature) return;
  if (zoomLevelSingleMarker > 15.5) {
    feature.setStyle(getHouseStyle(labelText));
  } else {
    feature.setStyle(getDotStyle(4));
  }
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
        color: 'blue',
      }),
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    }),
  });
};

const getDotStyle = (radius: number): StyleLike | undefined => {
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
};

@Injectable()
export class UserMarkers {
  private zoomInput = new Subject<ObjectEvent>();
  public zoomLevelSingleMarker = 13;
  private userMarkers: Record<string, Feature> = {};
  private markersVectorLayer = new VectorLayer<
    Vector<Feature<Geometry>>,
    Feature<Geometry>
  >();
  private map!: Map;

  constructor(private readonly userPositionService: UserPositionService) {
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
      vectorLayerSource.addFeatures(Object.values(this.userMarkers));
    }
  }

  public updateUserMarkerStyle() {
    Object.keys(this.userMarkers).forEach((key) => {
      const userPos = this.userPositionService.getUserPosition(key);
      let labelText = '';
      if (userPos?.details) {
        labelText = getAddress(userPos.details);
      } else {
        labelText = userPos?.userName || 'Unknown';
      }
      styleUser(this.userMarkers[key], labelText, this.zoomLevelSingleMarker);
      this.userMarkers[key].changed();
    });
    this.refreshVectorLayer();
  }

  public setupMap(userPositions: GeoPosition[], view: View) {
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
      styleUser(
        this.userMarkers[userPosition.id],
        userPosition.details
          ? `${getAddress(userPosition.details)}`
          : userPosition.userName,
        this.zoomLevelSingleMarker
      );
    });
    this.refreshVectorLayer();
  }

  private onViewChanged(map: Map) {
    const view = map.getView();
    this.zoomLevelSingleMarker = view?.getZoom() || 13;
    this.updateUserMarkerStyle();
    console.log('zoom', this.zoomLevelSingleMarker);
  }

  public initializeUseMarkers(map: Map) {
    this.map = map;
    this.markersVectorLayer = new VectorLayer({
      source: new Vector({ features: Object.values(this.userMarkers) }),
    });
    map.addLayer(this.markersVectorLayer);
    const view = map.getView();
    view.setZoom(this.zoomLevelSingleMarker);
    map.getView().on('change:resolution', (e) => {
      this.zoomInput.next(e);
    });
  }
}
