import { Routes } from '@angular/router';
import { TheHangOutComponent } from './routes/hangout/theHangOut/theHangOut.component';
import { HomeComponent } from './routes/home/home.component';
import { HousesComponent } from './routes/houses/houses.component';
// import { LocationMapComponent } from './location-map/location-map.component';

export const routes: Routes = [
  {
    path: 'hangout/:userId/:username',
    component: TheHangOutComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'location',
    component: HomeComponent, // disabled routing to the old LocationMapComponent,
  },
  {
    path: '',
    component: HousesComponent,
  },
];
