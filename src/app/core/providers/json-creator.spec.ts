import { TestBed } from '@angular/core/testing';

import { JsonCreator } from './json-creator';

describe('JsonCreator', () => {
  let service: JsonCreator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonCreator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save a JSON object as blob to a file', () => {
    const mockRevokeObjectURL = jest.fn();
    const originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
    const urlRegEx = /^blob:http:\/\/localhost\//;
    const link = {
      click: jest.fn(),
    } as unknown as HTMLLinkElement;
    jest.spyOn(document, 'createElement').mockImplementation(() => link);

    const jsonObject = JSON.stringify({ name: 'Test', value: 42 });
    const fileName = 'test.json';
    service.saveJsonFile(jsonObject, fileName);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((link as any).download).toEqual(fileName);
    expect(link.href).toMatch(urlRegEx);
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(
      expect.stringMatching(urlRegEx)
    );
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });
});
