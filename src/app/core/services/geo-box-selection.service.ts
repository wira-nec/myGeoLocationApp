import { Injectable } from '@angular/core';
import { Collection, Feature, Map } from 'ol';
import Select from 'ol/interaction/Select';
import DragBox from 'ol/interaction/DragBox';
import { shiftKeyOnly } from 'ol/events/condition';
import VectorSource from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import { Subject } from 'rxjs';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';

@Injectable({
  providedIn: 'root',
})
export class GeoBoxSelectionService {
  featureSelection$ = new Subject<Collection<Feature<Geometry>>>();
  private selectedFeatures!: Collection<Feature<Geometry>>;

  setupBoxSelection(
    map: Map,
    vectorLayer: VectorLayer<Vector<Feature<Geometry>>, Feature<Geometry>>
  ) {
    const select = new Select();
    // a normal select interaction to handle click
    map.addInteraction(select);
    this.selectedFeatures = select.getFeatures();
    // a DragBox interaction used to select features by drawing boxes
    const dragBox = new DragBox({
      condition: shiftKeyOnly,
    });

    const vectorSource = vectorLayer.getSource() as VectorSource;

    map.addInteraction(dragBox);

    dragBox.on('boxend', () => {
      // features that intersect the box are added to the collection of
      // selected features.
      const extent = dragBox.getGeometry().getExtent();
      vectorSource.forEachFeatureIntersectingExtent(extent, (feature) => {
        this.selectedFeatures.push(feature);
      });
      this.featureSelection$.next(this.selectedFeatures);
    });

    // clear selection when drawing a new box and when clicking on the map
    dragBox.on('boxstart', () => {
      this.selectedFeatures.clear();
      this.featureSelection$.next(this.selectedFeatures);
    });

    map.on('click', () => {
      this.selectedFeatures.clear();
      this.featureSelection$.next(this.selectedFeatures);
    });
  }
}
