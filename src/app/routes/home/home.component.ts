import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { GeolocationService } from '../../core/services/geoLocationService';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../../shared/ol-map/ol-map.component';
import { GeoPosition } from '../../shared/view-models/geoPosition';
import { AuthService } from '../../core/services/auth.service';
import { GeoPositionService } from '../../core/services/geo-position.service';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [HeaderComponent, CommonModule, MapComponent],
})
export class HomeComponent implements OnInit {
  error: GeolocationPositionError | null = null;
  geoPosition: GeoPosition | undefined;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private readonly geoPositions$: GeoPositionService,
    readonly geolocation$: GeolocationService
  ) {}

  username = '';
  userId = '';

  ngOnInit() {
    const authServiceSubscription = this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user?.id) {
          if (!!this.userId && this.userId !== user.id) {
            this.geoPositions$.removeGeoPosition(this.userId);
          }
          this.username = user.name;
          this.userId = user.id;
          this.showMap();
        } else {
          // user is logged out
          this.userId = '';
          this.username = '';
          this.geoPosition = undefined;
          this.geoPositions$.clearGeoPositions();
        }
      });
    this.destroyRef.onDestroy(() => {
      authServiceSubscription.unsubscribe();
    });
  }

  navigateToHangout() {
    this.router.navigate(['/hangout', this.userId, this.username]);
  }

  private showMap() {
    this.geolocation$.pipe(first()).subscribe({
      next: (position) => {
        this.error = null;
        this.geoPosition = {
          id: this.userId,
          userName: this.username,
          geoPositionInfo: 'Just created user',
          coords: position.coords,
          center: [0, 0],
          zoom: 14,
        } as GeoPosition;
        this.geoPositions$.addGeoPositions([this.geoPosition]);
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        this.error = err;
      },
    });
  }
}
