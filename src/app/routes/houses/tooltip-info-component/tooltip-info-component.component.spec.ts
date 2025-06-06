import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TooltipInfoComponentComponent } from './tooltip-info-component.component';

describe('TooltipInfoComponentComponent', () => {
  let component: TooltipInfoComponentComponent;
  let fixture: ComponentFixture<TooltipInfoComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipInfoComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TooltipInfoComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
