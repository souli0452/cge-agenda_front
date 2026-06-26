import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient,
         withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler,
         provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
import { appRoutes } from './app.routes';
import { initializeKeycloak } from '@/init/keycloak-init.factory';

class AppErrorHandler implements ErrorHandler {
    handleError(error: any): void {
        if (error?.code === 5104 || error?.message?.includes('NG05104') || error?.message?.includes('app-root')) return;
        console.error(error);
    }
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            appRoutes,
            withInMemoryScrolling({
                anchorScrolling: 'enabled',
                scrollPositionRestoration: 'enabled'
            })
        ),
        provideHttpClient(withFetch(), withInterceptorsFromDi()),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: { darkModeSelector: '.app-dark' }
            }
        }),
        { provide: ErrorHandler, useClass: AppErrorHandler },
        ConfirmationService,
        KeycloakService,
        {
            provide: APP_INITIALIZER,
            useFactory: initializeKeycloak,
            multi: true,
            deps: [KeycloakService, HttpClient]
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: KeycloakBearerInterceptor,
            multi: true
        }, provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
    ]
};