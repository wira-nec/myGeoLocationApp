import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription, take } from 'rxjs';
import { GeolocationService } from '../../../core/services/geoLocationService';
import { MapComponent } from '../map/map.component';
//import { MapComponent } from '../ol-map/ol-map.component';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [MapComponent, CommonModule],
  templateUrl: './location-map.component.html',
  styleUrl: './location-map.component.scss',
})
export class LocationMapComponent implements OnInit {
  toggle = true;
  position: GeolocationPosition | null = null;
  currentPositionUrl: SafeResourceUrl | null = null;
  watchSubscription: Subscription | null = null;
  error: GeolocationPositionError | null = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    readonly geolocation$: GeolocationService,
    private readonly domSanitizer: DomSanitizer,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const geoLocationSubscription = this.geolocation$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (position) => {
          this.currentPositionUrl = this.getUrl(position);
          this.changeDetectorRef.markForCheck();
        },
      });
    this.destroyRef.onDestroy(() => {
      geoLocationSubscription.unsubscribe();
    });
  }

  getCurrentPosition() {
    this.geolocation$.pipe(take(1)).subscribe({
      next: (position) => {
        this.currentPositionUrl = this.getUrl(position);
        this.changeDetectorRef.markForCheck();
      },
      error: (error) => {
        this.error = error;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  toggleWatch() {
    this.toggle = !this.toggle;
  }

  private getUrl(position: GeolocationPosition): SafeResourceUrl {
    const longitude = position.coords.longitude;
    const latitude = position.coords.latitude;
    this.position = position;

    return this.domSanitizer.bypassSecurityTrustResourceUrl(
      `//www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${
        latitude - 0.005
      },${longitude + 0.005},${latitude + 0.005}&marker=${
        position.coords.latitude
      },${position.coords.longitude}&layer=mapnik`
    );
  }
}
