import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomFileSelectionSheetComponent } from './bottom-file-selection-sheet.component';

describe('BottomFileSelectionSheetComponent', () => {
  let component: BottomFileSelectionSheetComponent;
  let fixture: ComponentFixture<BottomFileSelectionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomFileSelectionSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomFileSelectionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
