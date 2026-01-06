import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard extends KeycloakAuthGuard {
  constructor(
    protected override readonly router: Router,
    protected readonly keycloak: KeycloakService
  ) {
    super(router, keycloak);
  }

  public async isAccessAllowed(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    // 1. Force l'utilisateur à se connecter s'il ne l'est pas
    if (!this.authenticated) {
      await this.keycloak.login({
        redirectUri: window.location.origin + state.url
      });
    }

    // 2. Récupère les rôles requis définis dans la route (data: { roles: ['ADMIN'] })
    const requiredRoles = route.data['roles'];

    // 3. Si aucun rôle n'est requis pour cette route, on laisse passer
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
    }

    // 4. Vérifie si l'utilisateur possède au moins l'un des rôles requis
    const hasRequiredRole = requiredRoles.every((role) => this.roles.includes(role));

    if (!hasRequiredRole) {
      // Redirige vers une page "Accès refusé" ou la racine si les rôles ne matchent pas
      return this.router.parseUrl('/access-denied');
    }

    return true;
  }
}