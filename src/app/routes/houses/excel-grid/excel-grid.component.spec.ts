import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelGridComponent } from './excel-grid.component';

describe('ExcelGridComponent', () => {
  let component: ExcelGridComponent;
  let fixture: ComponentFixture<ExcelGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
