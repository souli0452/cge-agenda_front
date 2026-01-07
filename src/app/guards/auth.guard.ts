import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class AuthGuard extends KeycloakAuthGuard {
  constructor(
    protected override readonly router: Router,
    protected readonly keycloak: KeycloakService
  ) 

  {
    super(router, keycloak);
  }

  public async isAccessAllowed(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Promise<boolean | UrlTree> {


      // Force the user to log in if currently unauthenticated.
    if (!this.authenticated) {
      await this.keycloak.login({
        redirectUri: window.location.origin + state.url + '/dashboard'
      });
    }



  // 🔒 À ce stade, l'utilisateur est déjà authentifié
  const requiredRoles = route.data['roles'];

  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
    return true;
  }

  const hasRequiredRole = requiredRoles.some(role =>
    this.roles.includes(role)
  );

  return hasRequiredRole ? true : this.router.parseUrl('/access-denied');
}
}