import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelContentComponent } from './excel-content.component';

describe('ExcelContentComponent', () => {
  let component: ExcelContentComponent;
  let fixture: ComponentFixture<ExcelContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
