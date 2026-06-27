import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

// Bloquer uniquement dans les iframes cross-origin de Keycloak (3P cookie check)
// Les iframes same-origin (simulateurs, outils DevTools) sont autorisées
const isKeycloakIframe = (() => {
    try {
        if (window === window.parent) return false;
        // Si on peut accéder au parent (same-origin), ce n'est pas Keycloak
        void window.parent.location.href;
        return false;
    } catch {
        // parent cross-origin → iframe Keycloak
        return true;
    }
})();

if (!isKeycloakIframe) {
    bootstrapApplication(AppComponent, appConfig).catch((err) => {
        if (err?.code !== 5104) console.error(err);
    });
}
