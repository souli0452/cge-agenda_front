import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router,
         RouterStateSnapshot, UrlTree } from '@angular/router';
import { KeycloakAuthGuard, KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
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

        if (!this.authenticated) {
            await this.keycloak.login({
                redirectUri: window.location.origin + '/dashboard'
            });
            return false;
        }

        const requiredRoles: string[] = route.data['roles'];

        if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
            return true;
        }

        const hasRequiredRole = requiredRoles.some(role =>
            this.roles.includes(role)
        );

        return hasRequiredRole
            ? true
            : this.router.parseUrl('/access-denied');
    }
}