import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
} from '@angular/core';
import Map from 'ol/Map';
import ControlMousePosition from 'ol/control/MousePosition';
import { CoordinateFormatterService } from '../../core/services/coordinate-formatter.service';
import { Coordinate } from 'ol/coordinate';

@Component({
  selector: 'app-mouse-position',
  standalone: true,
  template: ``,
  styles: [
    `
      ::ng-deep .ol-scale-line {
        position: relative;
      }

      ::ng-deep .ol-scale-line,
      ::ng-deep .ol-scale-line-inner {
        background-color: transparent;
        border-color: var(--text-color);
        color: var(--text-color);
        font-size: inherit;
        bottom: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MousePositionComponent implements OnInit {
  @Input() map: Map | null = null;
  control: ControlMousePosition | null = null;

  constructor(
    private element: ElementRef,
    private coordinateFormatter: CoordinateFormatterService
  ) {}

  ngOnInit() {
    this.control = new ControlMousePosition({
      className: 'mouseposition-control',
      coordinateFormat: (coordinates: Coordinate | undefined) =>
        this.coordinateFormatter.numberCoordinates(coordinates, 4),
      target: this.element.nativeElement,
    });
    this.map?.addControl(this.control);
  }
}
