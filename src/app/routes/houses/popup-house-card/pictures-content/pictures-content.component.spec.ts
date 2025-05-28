import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PicturesContentComponent } from './pictures-content.component';

describe('PicturesContentComponent', () => {
  let component: PicturesContentComponent;
  let fixture: ComponentFixture<PicturesContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PicturesContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PicturesContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
