import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomFileSelectionSheetComponent } from './bottom-file-selection-sheet.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

describe('BottomFileSelectionSheetComponent', () => {
  let component: BottomFileSelectionSheetComponent;
  let fixture: ComponentFixture<BottomFileSelectionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomFileSelectionSheetComponent],
      providers: [
        {
          provide: MatBottomSheetRef,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomFileSelectionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
