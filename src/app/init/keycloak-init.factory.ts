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
                onLoad:                    'login-required',
                pkceMethod:                'S256',
                checkLoginIframe:          false,
                silentCheckSsoRedirectUri: `${environments.appUrl}/assets/silent-check-sso.html`,
                adapter:                   'default'
            },
            enableBearerInterceptor: true,
            bearerPrefix:            'Bearer',
            bearerExcludedUrls: [
                '/assets',
                '/api/auth/login'
            ]
        }).then(authenticated => {
            if (authenticated) {
                // Fire-and-forget : ne bloque pas l'init si le serveur est indisponible
                http.post(`${environments.apiUrl}/auth/track-login`, null)
                    .subscribe({ error: () => {} });
            }
        });
}