import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import ResizeObserver from 'resize-observer-polyfill';

let consoleSpy: jest.SpyInstance;

setupZoneTestEnv();

global.ResizeObserver = ResizeObserver;

beforeAll(() => {
  consoleSpy = jest
    .spyOn(global.console, 'error')
    .mockImplementation((message) => {
      if (!message?.message?.includes('Could not parse CSS stylesheet')) {
        global.console.warn(message);
      }
    });
});

afterAll(() => consoleSpy.mockRestore());
