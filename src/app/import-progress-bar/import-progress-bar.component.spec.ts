import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportProgressBarComponent } from './import-progress-bar.component';

describe('ImportProgressBarComponent', () => {
  let component: ImportProgressBarComponent;
  let fixture: ComponentFixture<ImportProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportProgressBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
