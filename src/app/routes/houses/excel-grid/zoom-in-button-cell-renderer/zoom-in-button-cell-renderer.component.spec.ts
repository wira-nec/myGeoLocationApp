import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomInButtonCellRendererComponent } from './zoom-in-button-cell-renderer.component';

describe('ZoomInButtonCellRendererComponent', () => {
  let component: ZoomInButtonCellRendererComponent;
  let fixture: ComponentFixture<ZoomInButtonCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoomInButtonCellRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZoomInButtonCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
