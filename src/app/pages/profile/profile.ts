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
    styles: [`
        .pf-page { padding: 0; }

        /* ── HERO ── */
        .pf-hero {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            margin-bottom: 24px;
            background: linear-gradient(135deg, #145214 0%, #228B22 55%, #2e9e2e 100%);
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            padding: 36px 32px;
            color: white;
        }

        .pf-hero-bg {
            position: absolute;
            top: -80px; right: -80px;
            width: 320px; height: 320px;
            background: rgba(255,255,255,0.07);
            border-radius: 50%;
            pointer-events: none;
        }
        .pf-hero-bg::after {
            content: '';
            position: absolute;
            bottom: -60px; left: -60px;
            width: 200px; height: 200px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
        }

        .pf-hero-content {
            position: relative;
            display: flex; align-items: center; gap: 28px; flex-wrap: wrap;
        }

        /* Avatar */
        .pf-avatar-wrap {
            position: relative; flex-shrink: 0;
        }

        .pf-avatar {
            width: 88px; height: 88px; border-radius: 50%;
            background: rgba(255,255,255,0.22);
            border: 3px solid rgba(255,255,255,0.5);
            display: flex; align-items: center; justify-content: center;
            font-size: 34px; font-weight: 800; color: white;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }

        .pf-online-dot {
            position: absolute; bottom: 4px; right: 4px;
            width: 16px; height: 16px; border-radius: 50%;
            background: #4caf50;
            border: 2px solid white;
            box-shadow: 0 0 0 2px rgba(76,175,80,0.4);
        }

        /* Infos hero */
        .pf-hero-info { flex: 1; min-width: 0; }

        .pf-hero-name {
            margin: 0 0 6px; font-size: 28px; font-weight: 800;
            color: #ffffff; text-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .pf-hero-username {
            margin: 0 0 14px; font-size: 14px;
            color: rgba(255,255,255,0.78);
            display: flex; align-items: center; gap: 5px;
        }

        .pf-roles-row {
            display: flex; flex-wrap: wrap; gap: 8px;
        }

        .pf-role-badge {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 4px 12px; border-radius: 20px;
            font-size: 12px; font-weight: 700;
            backdrop-filter: blur(4px);
        }

        /* Actions hero */
        .pf-hero-actions {
            display: flex; flex-direction: column; gap: 8px;
            flex-shrink: 0; margin-left: auto;
        }

        /* ── GRILLE ── */
        .pf-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        @media (max-width: 900px) {
            .pf-grid { grid-template-columns: 1fr; }
            .pf-hero-actions { flex-direction: row; margin-left: 0; }
        }

        /* ── CARTES ── */
        .pf-card {
            background: var(--surface-card);
            border-radius: 16px;
            padding: 22px 24px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }

        .pf-card-hd {
            display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
        }

        .pf-card-icon {
            width: 38px; height: 38px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; flex-shrink: 0;
        }

        .pf-card-hd h3 {
            margin: 0; font-size: 16px; font-weight: 700;
            color: var(--text-color);
        }

        /* Lignes d'info */
        .pf-info-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 11px 0;
            border-bottom: 1px solid var(--surface-border);
        }
        .pf-info-row:last-child { border-bottom: none; }

        .pf-info-lbl {
            display: flex; align-items: center; gap: 7px;
            font-size: 13px; color: var(--text-color-secondary); font-weight: 500;
        }

        .pf-info-val {
            font-size: 14px; font-weight: 600; color: var(--text-color);
        }

        .pf-mono { font-family: monospace; font-size: 13px; }

        /* Rôles liste */
        .pf-roles-list {
            display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px;
        }

        .pf-role-item {
            display: flex; align-items: center; gap: 12px;
            padding: 10px 12px;
            background: var(--surface-ground);
            border-radius: 10px;
        }

        .pf-role-dot {
            width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
        }

        .pf-role-name  { font-size: 14px; font-weight: 600; color: var(--text-color); }
        .pf-role-key   { font-size: 11px; color: var(--text-color-secondary); display: block; margin-top: 1px; }

        /* Permissions */
        .pf-perms {
            display: flex; flex-direction: column; gap: 8px; margin-top: 4px;
        }

        .pf-perm {
            display: flex; align-items: center; gap: 8px;
            font-size: 13px; color: var(--text-color-secondary);
            padding: 6px 0;
        }

        .pf-perm i { font-size: 15px; color: #bbb; }
        .pf-perm-on { color: var(--text-color); }
        .pf-perm-on i { color: #4caf50; }

        .pf-empty {
            display: flex; align-items: center; gap: 8px;
            color: var(--text-color-secondary); font-size: 13px; padding: 8px 0;
        }
    `]
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
