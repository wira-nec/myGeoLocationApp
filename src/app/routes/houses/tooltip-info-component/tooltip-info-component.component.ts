import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
} from '@angular/core';
import { Map } from 'ol';
import { MapEventHandlers } from '../providers/mapEventHandlers';

@Component({
  selector: 'app-tooltip-info-component',
  imports: [],
  templateUrl: './tooltip-info-component.component.html',
  styleUrl: './tooltip-info-component.component.scss',
})
export class TooltipInfoComponentComponent implements AfterViewInit {
  @Input() map!: Map;
  @ViewChild('tooltip_info') tooltipInfo!: ElementRef;

  constructor(private readonly mapEventHandlers: MapEventHandlers) {}

  ngAfterViewInit(): void {
    this.mapEventHandlers.assignTooltipHandlers(
      this.map,
      this.tooltipInfo.nativeElement
    );
  }
}
