import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { PusherService } from '../../services/pusher.service';
import { HeaderComponent } from '../header/header.component';
import { MapComponent } from '../ol-map/ol-map.component';
import { CommonModule } from '@angular/common';
import { GeolocationService } from '../../services/geoLocationService';
import { GeoPosition } from '../view-models/geoPosition';
import { UserPositionServiceService } from '../../services/user-position-service.service';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { pingServer, removeServer } from '../helpers/pushServers';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-hangout',
  templateUrl: './theHangOut.component.html',
  styleUrls: ['./theHangOut.component.scss'],
  imports: [HeaderComponent, MapComponent, CommonModule],
})
export class TheHangOutComponent
  implements OnInit, AfterContentInit, OnDestroy
{
  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly pusher: PusherService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly userPositions: UserPositionServiceService,
    private readonly authService: AuthService,
    private readonly router: Router,
    readonly geolocation$: GeolocationService
  ) {}

  userPosition$: Observable<GeoPosition> | undefined;
  username = '';
  userId = '';
  message = '';
  showAlert = false;
  showLocationUpdate = false;

  private pingMyPosition(myPosition: GeoPosition | undefined, info: string) {
    if (myPosition) {
      pingServer(this.http, {
        userId: this.userId,
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
      this.userId = this.route.snapshot.paramMap.get('userId') as string;
      this.username = this.route.snapshot.paramMap.get('username') as string;
      const thisUserPos = this.userPositions.getUserPosition(this.userId);
      if (!thisUserPos) {
        this.logout();
      } else {
        this.userPosition$ = this.userPositions.userPositions$.asObservable();
        this.authService.user$.subscribe((user) => {
          if (!user?.id) {
            // user is logged out
            this.logout();
          }
        });
        this.userPositions.userPositions$.next(thisUserPos);
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
            let userPos = this.userPositions.getUserPosition(pingData.userId);
            if (userPos) {
              this.userPositions.setUserCoordinatesAndOrZoom(pingData.userId, {
                ...userPos.coords,
                latitude: pingData.lat,
                longitude: pingData.lng,
              });
            } else {
              userPos = {
                id: pingData.userId,
                userName: pingData.username,
                info: 'Todo ?',
                coords: {
                  latitude: pingData.lat,
                  longitude: pingData.lng,
                },
                center: [0, 0],
                zoom: 14,
              } as GeoPosition;
              this.userPositions.addUserPosition(userPos);
              // Found a new user, so ping this user position
              const myPosition = this.userPositions.getUserPosition(
                this.userId
              );
              // Give other user time to setup it push channel
              setTimeout(() => {
                this.pingMyPosition(
                  myPosition,
                  `Welcome ${pingData.username} to the Hangout`
                );
              }, 1000);
            }
            this.userPositions.userPositions$.next(userPos);
            this.showLocationUpdate = true;
            this.message = `User "${userPos.userName}" says '${pingData.info}'`;
            this.changeDetectorRef.markForCheck();
          }
        );
        // Look for user that are removed.
        channel.bind('remove', (data: { userId: string }) => {
          const userPos = this.userPositions.removeUserPosition(data.userId);
          if (userPos) {
            this.showLocationUpdate = true;
            this.message = `User "${userPos.userName}" says goodbye`;
            this.changeDetectorRef.markForCheck();
          }
        });
      }
    }
  }

  ngAfterContentInit(): void {
    const thisUserPos = this.userPositions.getUserPosition(this.userId);
    if (thisUserPos) {
      this.pingMyPosition(
        thisUserPos,
        `Hello, I'm ${this.username} and I just joined the Hangout`
      );
    }
  }

  private logout() {
    this.userPositions.clearUserPositions();
    this.navigateHome();
  }

  private navigateHome() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy() {
    removeServer(this.http, { userId: this.userId });
    this.userId = '';
    this.username = '';
  }
}
