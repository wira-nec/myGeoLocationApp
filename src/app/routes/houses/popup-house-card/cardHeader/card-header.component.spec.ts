import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardHeaderComponent } from './card-header.component';

describe('CardHeaderComponent', () => {
  let component: CardHeaderComponent;
  let fixture: ComponentFixture<CardHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
