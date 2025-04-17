import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScaleLineComponent } from './scaleLine.component';

describe('ScalelineComponent', () => {
  let component: ScaleLineComponent;
  let fixture: ComponentFixture<ScaleLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScaleLineComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScaleLineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
