import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
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
  DataStoreService,
  hasPictures,
  StoreData,
  UNIQUE_ID,
} from '../../../core/services/data-store.service';
import { CommonModule, NgClass } from '@angular/common';
import { FontSizeService } from '../../../core/services/font-size.service';
import { CardHeaderComponent } from './cardHeader/card-header.component';
import { ExcelContentComponent } from './excel-content/excel-content.component';
import { PicturesContentComponent } from './pictures-content/pictures-content.component';
import { MapEventHandlers } from '../providers/mapEventHandlers';
import { CardFooterComponent } from './card-footer/card-footer.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private ref: ElementRef,
    private readonly mapEventHandlers: MapEventHandlers,
    public changeDetectorRef: ChangeDetectorRef,
    readonly fontSizeService: FontSizeService,
    private readonly dataStoreService: DataStoreService
  ) {}

  details!: StoreData;
  showPicture = false;

  private callback = (storeData: StoreData) => {
    this.details = storeData;
    this.showPicture = hasPictures(storeData);
    this.changeDetectorRef.markForCheck();
  };

  ngOnInit() {
    const dataStoreSubscription = this.dataStoreService.dataStore$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((storeDataArray: StoreData[]) => {
        const storeData = storeDataArray.find(
          (value) =>
            this.details && value[UNIQUE_ID] === this.details[UNIQUE_ID]
        );
        if (storeData) {
          this.details = storeData;
          this.showPicture = hasPictures(storeData);
          this.changeDetectorRef.markForCheck();
        }
      });
    this.destroyRef.onDestroy(() => {
      dataStoreSubscription.unsubscribe();
    });

    if (this.map) {
      this.mapEventHandlers.assignClickHandler(
        this.map,
        this.callback,
        this.ref.nativeElement
      );
    }
  }
}
