import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HousesMapComponent } from './houses-map.component';

describe('HousesMapComponent', () => {
  let component: HousesMapComponent;
  let fixture: ComponentFixture<HousesMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HousesMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HousesMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
