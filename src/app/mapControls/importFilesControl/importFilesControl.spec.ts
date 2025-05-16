import { ImportFilesControl } from './importFilesControl';
import { TestBed } from '@angular/core/testing';

describe('ImportFileControl', () => {
  it('should create an instance', () => {
    expect(
      TestBed.runInInjectionContext(() => new ImportFilesControl({}))
    ).toBeTruthy();
  });
});
