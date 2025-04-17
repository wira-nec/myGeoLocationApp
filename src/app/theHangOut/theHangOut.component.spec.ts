import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TheHangOutComponent } from './theHangOut.component';

describe('TheHangOutComponent', () => {
  let component: TheHangOutComponent;
  let fixture: ComponentFixture<TheHangOutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TheHangOutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TheHangOutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
