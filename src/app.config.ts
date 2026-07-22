import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient,
         withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler,
         provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

const ascelcGreenScale = {
    50:  '#e5f4ec',
    100: '#bce4cd',
    200: '#90d1ac',
    300: '#5fbd87',
    400: '#2da861',
    500: '#009640',
    600: '#008539',
    700: '#006e2f',
    800: '#005122',
    900: '#003416',
    950: '#001d0c'
};

const AscelcTheme = definePreset(Aura, {
    primitive: {
        // Aligne la palette "green" interne de PrimeNG (utilisée par severity="success"
        // sur p-tag/p-button/p-message) sur le vert de marque ASCE-LC, au lieu du vert
        // Tailwind par défaut (#22c55e) qui produisait un vert différent du reste de l'app.
        green: ascelcGreenScale
    },
    semantic: {
        primary: ascelcGreenScale
    }
});
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';
import { appRoutes } from './app.routes';
import { initializeKeycloak } from '@/init/keycloak-init.factory';
import { errorInterceptor } from '@/interceptors/error.interceptor';

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
        provideHttpClient(withFetch(), withInterceptors([errorInterceptor]), withInterceptorsFromDi()),
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