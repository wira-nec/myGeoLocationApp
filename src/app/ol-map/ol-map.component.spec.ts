import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlMapComponent } from './ol-map.component';

describe('OlMapComponent', () => {
  let component: OlMapComponent;
  let fixture: ComponentFixture<OlMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OlMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
