import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
} from '@angular/core';
import Map from 'ol/Map';

@Component({
  selector: 'app-ol-map',
  template: '',
  styles: [':host { width: 100%; height: 100%; display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlMapComponent implements OnInit {
  @Input() map: Map | null = null;
  constructor(private elementRef: ElementRef) {}
  ngOnInit() {
    this.map?.setTarget(this.elementRef.nativeElement);
  }
}
