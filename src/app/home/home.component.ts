import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { GeolocationService } from '../../services/geoLocationService';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { MapComponent } from '../ol-map/ol-map.component';
import { GeoPosition } from '../view-models/geoPosition';
import { AuthService } from '../../services/auth.service';
import { UserPositionService } from '../../services/user-position.service';
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
  userPosition: GeoPosition | undefined;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private readonly userPositions$: UserPositionService,
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
            this.userPositions$.removeUserPosition(this.userId);
          }
          this.username = user.name;
          this.userId = user.id;
          this.showMap();
        } else {
          // user is logged out
          this.userId = '';
          this.username = '';
          this.userPosition = undefined;
          this.userPositions$.clearUserPositions();
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
        this.userPosition = {
          id: this.userId,
          userName: this.username,
          userPositionInfo: 'Just created user',
          coords: position.coords,
          center: [0, 0],
          zoom: 14,
        } as GeoPosition;
        this.userPositions$.addUserPositions([this.userPosition]);
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        this.error = err;
      },
    });
  }
}
