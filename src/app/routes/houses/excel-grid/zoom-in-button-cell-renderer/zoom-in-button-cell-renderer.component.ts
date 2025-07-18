import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { GeoCoderService } from '../../../../core/services/geo-coder.service';
import { DataStoreService } from '../../../../core/services/data-store.service';

@Component({
  selector: 'app-zoom-in-button-cell-renderer',
  templateUrl: './zoom-in-button-cell-renderer.component.html',
  styleUrl: './zoom-in-button-cell-renderer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, MatBadgeModule],
})
export class ZoomInButtonCellRendererComponent
  implements ICellRendererAngularComp
{
  value = signal('');
  private geoCoderService!: GeoCoderService;
  private dataStoreService!: DataStoreService;

  agInit(params: ICellRendererParams): void {
    this.refresh(params);
  }
  refresh(params: ICellRendererParams): boolean {
    this.value.set(params.value);
    this.geoCoderService = params.context.geoDecoderService;
    this.dataStoreService = params.context.dataStoreService;
    return true;
  }

  zoomInOnAddress(location: string): void {
    const [longitude, latitude] = location.split(',');
    this.geoCoderService.zoomInOnCoordinates([
      Number(longitude),
      Number(latitude),
    ]);
    this.dataStoreService.setEditMode(false);
  }
}
