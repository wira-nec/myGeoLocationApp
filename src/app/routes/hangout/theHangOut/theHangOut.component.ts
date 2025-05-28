import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { PusherService } from '../../../core/services/pusher.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { MapComponent } from '../../../shared/ol-map/ol-map.component';
import { CommonModule } from '@angular/common';
import { GeolocationService } from '../../../core/services/geoLocationService';
import { GeoPosition } from '../../../shared/view-models/geoPosition';
import { GeoPositionService } from '../../../core/services/geo-position.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { pingServer, removeServer } from '../helpers/pushServers';
import { AuthService } from '../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-hangout',
  standalone: true,
  templateUrl: './theHangOut.component.html',
  styleUrls: ['./theHangOut.component.scss'],
  imports: [HeaderComponent, MapComponent, CommonModule],
})
export class TheHangOutComponent
  implements OnInit, AfterContentInit, OnDestroy
{
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly pusher: PusherService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly geoPositions: GeoPositionService,
    private readonly authService: AuthService,
    private readonly router: Router,
    readonly geolocation$: GeolocationService
  ) {}

  geoPosition$!: Observable<GeoPosition[]>;
  username = '';
  geoPositionId = '';
  message = '';
  showAlert = false;
  showLocationUpdate = false;

  private pingMyPosition(myPosition: GeoPosition | undefined, info: string) {
    if (myPosition) {
      pingServer(this.http, {
        userId: this.geoPositionId,
        lat: myPosition.coords.latitude,
        lng: myPosition.coords.longitude,
        username: this.username,
        info: info,
      });
    }
  }

  ngOnInit() {
    if (
      this.route.snapshot.paramMap.has('userId') &&
      this.route.snapshot.paramMap.has('username')
    ) {
      this.geoPositionId = this.route.snapshot.paramMap.get('userId') as string;
      this.username = this.route.snapshot.paramMap.get('username') as string;
      const theGeoPos = this.geoPositions.getGeoPosition(this.geoPositionId);
      if (!theGeoPos) {
        this.logout();
      } else {
        this.geoPosition$ = this.geoPositions.geoPositions$.asObservable();
        const authServiceSubscription = this.authService.user$
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((user) => {
            if (!user?.id) {
              // user is logged out
              this.logout();
            }
          });
        this.destroyRef.onDestroy(() => {
          authServiceSubscription.unsubscribe();
        });
        this.geoPositions.geoPositions$.next([theGeoPos]);
        const channel = this.pusher.init();
        // Start looking for other users
        channel.bind(
          'ping',
          (pingData: {
            lat: number;
            lng: number;
            userId: string;
            username: string;
            info: string;
          }) => {
            let geoPos = this.geoPositions.getGeoPosition(pingData.userId);
            if (geoPos) {
              this.geoPositions.setGeoCoordinatesAndOrZoom(pingData.userId, {
                ...geoPos.coords,
                latitude: pingData.lat,
                longitude: pingData.lng,
              });
            } else {
              geoPos = {
                id: pingData.userId,
                userName: pingData.username,
                geoPositionInfo: 'Todo ?',
                coords: {
                  latitude: pingData.lat,
                  longitude: pingData.lng,
                },
                center: [0, 0],
                zoom: 14,
              } as GeoPosition;
              this.geoPositions.addGeoPositions([geoPos]);
              // Found a new user, so ping this user position
              const myPosition = this.geoPositions.getGeoPosition(
                this.geoPositionId
              );
              // Give other user time to setup it push channel
              setTimeout(() => {
                this.pingMyPosition(
                  myPosition,
                  `Welcome ${pingData.username} to the Hangout`
                );
              }, 1000);
            }
            this.geoPositions.geoPositions$.next([geoPos]);
            this.showLocationUpdate = true;
            this.message = `User "${geoPos.userName}" says '${pingData.info}'`;
            this.changeDetectorRef.markForCheck();
          }
        );
        // Look for user that are removed.
        channel.bind('remove', (data: { userId: string }) => {
          const geoPos = this.geoPositions.removeGeoPosition(data.userId);
          if (geoPos) {
            this.showLocationUpdate = true;
            this.message = `User "${geoPos.userName}" says goodbye`;
            this.changeDetectorRef.markForCheck();
          }
        });
      }
    }
  }

  ngAfterContentInit(): void {
    const theGeoPos = this.geoPositions.getGeoPosition(this.geoPositionId);
    if (theGeoPos) {
      this.pingMyPosition(
        theGeoPos,
        `Hello, I'm ${this.username} and I just joined the Hangout`
      );
    }
  }

  private logout() {
    this.geoPositions.clearGeoPositions();
    this.navigateHome();
  }

  private navigateHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    removeServer(this.http, { userId: this.geoPositionId });
    this.geoPositionId = '';
    this.username = '';
  }
}
