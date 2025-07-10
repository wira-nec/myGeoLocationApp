import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCellRendererComponent } from './image-cell-renderer.component';

describe('ImageCellRendererComponent', () => {
  let component: ImageCellRendererComponent;
  let fixture: ComponentFixture<ImageCellRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCellRendererComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageCellRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
