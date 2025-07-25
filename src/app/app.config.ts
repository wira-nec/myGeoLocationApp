import {
  ApplicationConfig,
  provideZoneChangeDetection,
  //  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
// import { provideServiceWorker } from '@angular/service-worker';
import {
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    /* Disabled for now, as it requires a service worker file to be present
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    */
    // DI-based interceptors must be explicitly enabled.
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
  ],
};
