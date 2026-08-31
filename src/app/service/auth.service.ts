import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environments } from '../../environments/environments';
import { PermissionService } from './permission.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(private keycloak: KeycloakService, private permissionService: PermissionService) {}
    hasRole(role: string): boolean {
        return this.keycloak.isUserInRole(role);
    }

    hasAnyRole(...roles: string[]): boolean {
        return roles.some(role => this.keycloak.isUserInRole(role));
    }
    get isAdmin(): boolean { return this.hasRole('ADMIN'); }
    get isCGE():   boolean { return this.hasRole('CGE'); }

    get isDirecteurCabinet(): boolean {
        return this.hasRole('DIRECTEUR_CABINET');
    }

    get isProtocole():  boolean { return this.hasRole('PROTOCOLE'); }
    get isSecretaire(): boolean { return this.hasRole('SECRETAIRE'); }
    get isDelegue():    boolean { return this.hasRole('DELEGUE'); }
    get isUser():       boolean { return this.hasRole('USER'); }

    /**
     * Droits calculés à partir des permissions dynamiques (table role_permission,
     * éditable dans l'écran admin "Rôles & permissions"), résolues au démarrage
     * via PermissionService.chargerMesPermissions() (voir keycloak-init.factory.ts).
     */
    get canCreateEvent(): boolean {
        return this.permissionService.has('EVENT_CREATE');
    }

    get canEditEvent(): boolean {
        return this.permissionService.has('EVENT_EDIT');
    }

    get canValidateEvent(): boolean {
        return this.permissionService.has('EVENT_VALIDATE');
    }

    get canDeleteEvent(): boolean {
        return this.permissionService.has('EVENT_DELETE');
    }

    get canCancelOrPostpone(): boolean {
        return this.permissionService.has('EVENT_CANCEL_POSTPONE');
    }

    get canDelegate(): boolean {
        return this.permissionService.has('EVENT_DELEGATE');
    }

    get canExportPdf(): boolean {
        return this.permissionService.has('EVENT_EXPORT_PDF');
    }

    get isReadOnly(): boolean {
        return !this.canCreateEvent;
    }

    get username(): string {
        return this.keycloak.getKeycloakInstance()
            .tokenParsed?.['preferred_username'] || '';
    }

    get email(): string {
        return this.keycloak.getKeycloakInstance()
            .tokenParsed?.['email'] || '';
    }

    get firstName(): string {
        return this.keycloak.getKeycloakInstance()
            .tokenParsed?.['given_name'] || '';
    }

    get lastName(): string {
        return this.keycloak.getKeycloakInstance()
            .tokenParsed?.['family_name'] || '';
    }

    get fullName(): string {
        const first = this.firstName;
        const last  = this.lastName;
        if (first && last) return `${first} ${last}`;
        if (first)         return first;
        return this.username;
    }

    get roles(): string[] {
        return this.keycloak.getUserRoles() || [];
    }

    get token(): string {
        return this.keycloak.getKeycloakInstance().token || '';
    }

    get isAuthenticated(): boolean {
        return !!this.keycloak.getKeycloakInstance().authenticated;
    }
    logout(): void {
        this.keycloak.logout(environments.appUrl);
    }
}