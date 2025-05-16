import { TestBed } from '@angular/core/testing';
import { ExportControl } from './export-control';

describe('ExportControl', () => {
  it('should create an instance', () => {
    expect(
      TestBed.runInInjectionContext(() => new ExportControl())
    ).toBeTruthy();
  });
});
