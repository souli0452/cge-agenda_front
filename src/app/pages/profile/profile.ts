import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule }    from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { KeycloakService } from 'keycloak-angular';
import { AuthService }  from '../../service/auth.service';
import { ROLE_META, getRoleLabel } from '../../models';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, DividerModule],
    template: `
<div class="pf-page">

    <!-- HERO -->
    <div class="pf-hero">
        <div class="pf-hero-bg"></div>

        <div class="pf-hero-content">
            <div class="pf-avatar-wrap">
                <div class="pf-avatar">{{ initials }}</div>
                <span class="pf-online-dot" title="Connecté"></span>
            </div>

            <div class="pf-hero-info">
                <h1 class="pf-hero-name">{{ fullName }}</h1>
                <p class="pf-hero-username">
                    <i class="pi pi-at"></i> {{ username }}
                </p>
                <div class="pf-roles-row">
                    <span *ngFor="let r of displayRoles" class="pf-role-badge"
                          [style.background]="roleColor(r) + '22'"
                          [style.color]="roleColor(r)"
                          [style.border]="'1px solid ' + roleColor(r) + '55'">
                        <i class="pi" [ngClass]="roleIcon(r)"></i>
                        {{ roleLabel(r) }}
                    </span>
                </div>
            </div>

            <div class="pf-hero-actions">
                <p-button label="Retour" icon="pi pi-arrow-left"
                          [outlined]="true" severity="secondary"
                          (onClick)="goBack()"></p-button>
                <p-button label="Déconnexion" icon="pi pi-sign-out"
                          severity="danger" [outlined]="true"
                          (onClick)="logout()"></p-button>
            </div>
        </div>
    </div>

    <!-- GRILLE INFO -->
    <div class="pf-grid">

        <!-- Informations personnelles -->
        <div class="pf-card">
            <div class="pf-card-hd">
                <div class="pf-card-icon" style="background:#e8f5e9">
                    <i class="pi pi-user" style="color:#228B22"></i>
                </div>
                <h3>Informations personnelles</h3>
            </div>

            <div class="pf-info-row">
                <span class="pf-info-lbl"><i class="pi pi-id-card"></i> Prénom</span>
                <span class="pf-info-val">{{ firstName || '—' }}</span>
            </div>
            <div class="pf-info-row">
                <span class="pf-info-lbl"><i class="pi pi-id-card"></i> Nom</span>
                <span class="pf-info-val">{{ lastName || '—' }}</span>
            </div>
            <div class="pf-info-row">
                <span class="pf-info-lbl"><i class="pi pi-at"></i> Identifiant</span>
                <span class="pf-info-val pf-mono">{{ username || '—' }}</span>
            </div>
            <div class="pf-info-row">
                <span class="pf-info-lbl"><i class="pi pi-envelope"></i> Email</span>
                <span class="pf-info-val">{{ email || '—' }}</span>
            </div>
        </div>

        <!-- Rôles & permissions -->
        <div class="pf-card">
            <div class="pf-card-hd">
                <div class="pf-card-icon" style="background:#e3f2fd">
                    <i class="pi pi-shield" style="color:#1565C0"></i>
                </div>
                <h3>Rôles & permissions</h3>
            </div>

            <div class="pf-roles-list">
                <div *ngFor="let r of displayRoles" class="pf-role-item">
                    <div class="pf-role-dot" [style.background]="roleColor(r)"></div>
                    <div class="pf-role-details">
                        <span class="pf-role-name">{{ roleLabel(r) }}</span>
                        <span class="pf-role-key pf-mono">{{ r }}</span>
                    </div>
                </div>
                <div *ngIf="displayRoles.length === 0" class="pf-empty">
                    <i class="pi pi-info-circle"></i> Aucun rôle applicatif
                </div>
            </div>

            <p-divider></p-divider>

            <div class="pf-perms">
                <div class="pf-perm" [class.pf-perm-on]="authService.canCreateEvent">
                    <i class="pi" [ngClass]="authService.canCreateEvent ? 'pi-check-circle' : 'pi-times-circle'"></i>
                    Créer des événements
                </div>
                <div class="pf-perm" [class.pf-perm-on]="authService.canValidateEvent">
                    <i class="pi" [ngClass]="authService.canValidateEvent ? 'pi-check-circle' : 'pi-times-circle'"></i>
                    Valider des événements
                </div>
                <div class="pf-perm" [class.pf-perm-on]="authService.canDeleteEvent">
                    <i class="pi" [ngClass]="authService.canDeleteEvent ? 'pi-check-circle' : 'pi-times-circle'"></i>
                    Supprimer des événements
                </div>
                <div class="pf-perm" [class.pf-perm-on]="authService.canExportPdf">
                    <i class="pi" [ngClass]="authService.canExportPdf ? 'pi-check-circle' : 'pi-times-circle'"></i>
                    Exporter en PDF
                </div>
                <div class="pf-perm" [class.pf-perm-on]="authService.canDelegate">
                    <i class="pi" [ngClass]="authService.canDelegate ? 'pi-check-circle' : 'pi-times-circle'"></i>
                    Déléguer la participation
                </div>
            </div>
        </div>

    </div>

</div>
    `,
    styleUrls: ['./profile.css'],
})
export class ProfileComponent implements OnInit {

    firstName = '';
    lastName  = '';
    username  = '';
    email     = '';
    allRoles: string[] = [];

    private readonly APP_ROLES = Object.keys(ROLE_META);

    constructor(
        private keycloak:    KeycloakService,
        public  authService: AuthService,
        private router:      Router
    ) {}

    async ngOnInit(): Promise<void> {
        if (await this.keycloak.isLoggedIn()) {
            const profile = await this.keycloak.loadUserProfile();
            this.firstName = profile.firstName || '';
            this.lastName  = profile.lastName  || '';
            this.username  = profile.username  || '';
            this.email     = profile.email     || '';
        }
        this.allRoles = this.keycloak.getUserRoles() || [];
    }

    get fullName(): string {
        if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
        if (this.firstName) return this.firstName;
        return this.username;
    }

    get initials(): string {
        const f = this.firstName?.[0] || '';
        const l = this.lastName?.[0]  || '';
        return (f + l).toUpperCase() || (this.username?.[0] || 'U').toUpperCase();
    }

    get displayRoles(): string[] {
        return this.allRoles.filter(r => this.APP_ROLES.includes(r));
    }

    roleLabel(r: string): string { return getRoleLabel(r); }
    roleColor(r: string): string { return ROLE_META[r]?.color   || '#546E7A'; }
    roleIcon(r: string):  string { return ROLE_META[r]?.icon    || 'pi-user'; }

    goBack():  void { this.router.navigate(['/dashboard']); }
    logout():  void { this.keycloak.logout(); }
}
