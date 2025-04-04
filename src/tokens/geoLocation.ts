import { inject, InjectionToken } from '@angular/core';
import { WA_NAVIGATOR } from '@ng-web-apis/common';

export const GEOLOCATION = new InjectionToken<Geolocation>(
  'An abstraction over window.navigator.geolocation object',
  {
    factory: () => inject(WA_NAVIGATOR).geolocation,
  }
);
