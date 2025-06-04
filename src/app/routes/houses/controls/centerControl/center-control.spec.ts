import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CenterControl } from './center-control';

describe('CenterControl', () => {
  let component: CenterControl;
  let fixture: ComponentFixture<CenterControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CenterControl],
    }).compileComponents();

    fixture = TestBed.createComponent(CenterControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
