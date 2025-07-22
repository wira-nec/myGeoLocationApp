import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import Map from 'ol/Map';
import {
  hasPictures,
  StoreData,
} from '../../../core/services/data-store.service';
import { CommonModule, NgClass } from '@angular/common';
import { FontSizeService } from '../../../core/services/font-size.service';
import { CardHeaderComponent } from './cardHeader/card-header.component';
import { ExcelContentComponent } from './excel-content/excel-content.component';
import { PicturesContentComponent } from './pictures-content/pictures-content.component';
import { MapEventHandlers } from '../providers/mapEventHandlers';
import { CardFooterComponent } from './card-footer/card-footer.component';

@Component({
  selector: 'app-popup-house-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatListModule,
    MatGridListModule,
    MatIconModule,
    CommonModule,
    CardHeaderComponent,
    ExcelContentComponent,
    PicturesContentComponent,
    CardFooterComponent,
  ],
  hostDirectives: [NgClass],
  templateUrl: './popup-house-card.component.html',
  styleUrl: './popup-house-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopupHouseCardComponent implements OnInit {
  @Input() map!: Map;

  constructor(
    private ref: ElementRef,
    private readonly mapEventHandlers: MapEventHandlers,
    public changeDetectorRef: ChangeDetectorRef,
    readonly fontSizeService: FontSizeService
  ) {}

  details!: StoreData;

  checkIfItHasPictures(): boolean {
    return hasPictures(this.details);
  }

  private callback = (data: StoreData) => {
    this.details = data;
    this.changeDetectorRef.markForCheck();
  };

  ngOnInit() {
    if (this.map) {
      this.mapEventHandlers.assignClickHandler(
        this.map,
        this.callback,
        this.ref.nativeElement
      );
    }
  }
}
