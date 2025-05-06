import { Component } from '@angular/core';
import { HousesMapComponent } from '../houses-map/houses-map.component';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-houses',
  standalone: true,
  imports: [HousesMapComponent, CommonModule, MatTooltipModule],
  templateUrl: './houses.component.html',
  styleUrl: './houses.component.scss',
})
export class HousesComponent {}
