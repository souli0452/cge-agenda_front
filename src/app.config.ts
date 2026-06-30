import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient,
         withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler,
         provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

const AscelcTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50:  '#e8f7e8',
            100: '#c3eac3',
            200: '#9bdc9b',
            300: '#6fcc6f',
            400: '#42bf42',
            500: '#1AAF1A',
            600: '#178f17',
            700: '#136f13',
            800: '#0e5010',
            900: '#09350a',
            950: '#051f05'
        }
    }
});
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
                preset: AscelcTheme,
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