import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchControl } from './search-control';

describe('CenterControl', () => {
  let component: SearchControl;
  let fixture: ComponentFixture<SearchControl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchControl],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchControl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
