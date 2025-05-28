import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupHouseCardComponent } from './popup-house-card.component';

describe('PopupHouseCardComponent', () => {
  let component: PopupHouseCardComponent;
  let fixture: ComponentFixture<PopupHouseCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupHouseCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupHouseCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
