import { KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8080',
        realm: 'asce-lc-realm',
        clientId: 'agenda-cge',
      },
      initOptions: {
        onLoad: 'login-required', // ✅ force login
        pkceMethod: 'S256',
        checkLoginIframe: false,

        redirectUri: window.location.origin + '/dashboard', // ✅ retour après login
        responseMode: 'query', // ✅ évite le #fragment


        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',

      },
      enableBearerInterceptor: true,
      bearerPrefix: 'Bearer',
    });
}
