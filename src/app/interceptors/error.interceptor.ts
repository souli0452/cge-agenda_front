import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const keycloak = inject(KeycloakService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                keycloak.login({ redirectUri: window.location.href });
            } else if (error.status === 0) {
                console.error('Erreur réseau : impossible de contacter le serveur', req.url);
            } else {
                console.error(`Erreur HTTP ${error.status} sur ${req.url}`, error.error);
            }
            return throwError(() => error);
        })
    );
};
