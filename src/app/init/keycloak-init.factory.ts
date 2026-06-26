import { HttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
import { environments } from '../../environments/environments';

export function initializeKeycloak(keycloak: KeycloakService, http: HttpClient) {
    return () =>
        keycloak.init({
            config: {
                url:      environments.keycloak.url,
                realm:    environments.keycloak.realm,
                clientId: environments.keycloak.clientId,
            },
            initOptions: {
                onLoad:                   'login-required',
                pkceMethod:               'S256',
                checkLoginIframe:         false,
                checkLoginIframeInterval: 0,
                enableLogging:            false,
                adapter:                  'default',
                flow:                     'standard'
            },
            enableBearerInterceptor: true,
            bearerPrefix:            'Bearer',
            bearerExcludedUrls: [
                '/assets',
                '/api/auth/login'
            ]
        }).then(authenticated => {
            if (authenticated) {
                http.post(`${environments.apiUrl}/auth/track-login`, null)
                    .subscribe({ error: () => {} });
            }
        });
}