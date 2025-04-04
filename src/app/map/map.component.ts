import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent {
  @Input()
  set coordinatesChange(coords: GeolocationCoordinates | null) {
    this.coordsToStyle(coords);
    this.currentCoords = coords;
  }

  currentCoords: GeolocationCoordinates | null = null;

  initialCoords: GeolocationCoordinates | null = null;

  markerTransform$ = new BehaviorSubject<SafeStyle>('translate(0px,0px)');

  constructor(private readonly domSanitizer: DomSanitizer) {}

  private coordsToStyle(coordinates: GeolocationCoordinates | null) {
    if (!this.initialCoords || !coordinates) {
      this.initialCoords = coordinates;

      return;
    }

    const deltaX =
      (this.initialCoords.longitude - coordinates.longitude) * 10000;
    const deltaY = (this.initialCoords.latitude - coordinates.latitude) * 10000;
    const style = `translate(${deltaX}px,${deltaY}px)`;

    const safestyle = this.domSanitizer.bypassSecurityTrustStyle(style);

    this.markerTransform$.next(safestyle);
  }
}
