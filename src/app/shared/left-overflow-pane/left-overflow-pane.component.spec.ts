import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftOverflowPaneComponent } from './left-overflow-pane.component';

describe('LeftOverflowPaneComponent', () => {
  let component: LeftOverflowPaneComponent;
  let fixture: ComponentFixture<LeftOverflowPaneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftOverflowPaneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeftOverflowPaneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
