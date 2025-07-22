import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseSearchControlComponent } from './close-search-control.component';

describe('CloseSearchControlComponent', () => {
  let component: CloseSearchControlComponent;
  let fixture: ComponentFixture<CloseSearchControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloseSearchControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloseSearchControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
