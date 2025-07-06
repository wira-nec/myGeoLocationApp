import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditExcelControlComponent } from './edit-excel-control.component';

describe('EditExcelControlComponent', () => {
  let component: EditExcelControlComponent;
  let fixture: ComponentFixture<EditExcelControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditExcelControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditExcelControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
