import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesImportControlComponent } from './files-import-control.component';

describe('FilesImportControlComponent', () => {
  let component: FilesImportControlComponent;
  let fixture: ComponentFixture<FilesImportControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesImportControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilesImportControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
