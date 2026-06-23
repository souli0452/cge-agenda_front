import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient,
         withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig,
         provideZoneChangeDetection } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { initializeKeycloak } from '@/init/keycloak-init.factory';
import { KeycloakService, KeycloakBearerInterceptor } from 'keycloak-angular';

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
        }
    ]
};