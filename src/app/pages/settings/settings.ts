import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { KeycloakService }   from 'keycloak-angular';

import { CardModule }        from 'primeng/card';
import { ButtonModule }      from 'primeng/button';
import { ToastModule }       from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule }     from 'primeng/divider';
import { TagModule }         from 'primeng/tag';
import { SkeletonModule }    from 'primeng/skeleton';
import { MessageService }    from 'primeng/api';

import { AuthService }       from '../../../app/service/auth.service';
import { SettingsService, UserSettings } from '../../../app/service/settings.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        CardModule, ButtonModule, ToastModule,
        ToggleSwitchModule, DividerModule, TagModule, SkeletonModule
    ],
    providers: [MessageService],
    styleUrls: ['./settings.css'],
    template: `
<p-toast position="top-right"></p-toast>

<div class="settings-container">

    <!-- EN-TÊTE -->
    <div class="page-header">
        <div class="header-left">
            <div class="header-icon">
                <i class="pi pi-cog"></i>
            </div>
            <div>
                <h1 class="page-title">Paramètres</h1>
                <p class="page-subtitle">Gérez votre profil et vos préférences</p>
            </div>
        </div>
    </div>

    <div class="settings-grid">

        <!-- ========================================
             CARTE PROFIL
             ======================================== -->
        <div class="settings-card profile-card">
            <div class="card-header">
                <i class="pi pi-user card-icon"></i>
                <h2 class="card-title">Mon profil</h2>
            </div>
            <p-divider />

            <div class="profile-body">
                <!-- Avatar -->
                <div class="avatar-section">
                    <div class="profile-avatar" [style.background]="avatarColor">
                        {{ initials }}
                    </div>
                    <div class="profile-name">{{ fullName }}</div>
                    <div class="profile-role-badge"
                         [style.background]="roleColor + '20'"
                         [style.color]="roleColor"
                         [style.border]="'1px solid ' + roleColor + '40'">
                        {{ roleLabel }}
                    </div>
                </div>

                <!-- Infos -->
                <div class="profile-fields">
                    <div class="profile-field">
                        <span class="field-label">
                            <i class="pi pi-id-card"></i> Identifiant
                        </span>
                        <span class="field-value">{{ username }}</span>
                    </div>
                    <div class="profile-field">
                        <span class="field-label">
                            <i class="pi pi-envelope"></i> Email
                        </span>
                        <span class="field-value">{{ email }}</span>
                    </div>
                    <div class="profile-field">
                        <span class="field-label">
                            <i class="pi pi-shield"></i> Rôle principal
                        </span>
                        <span class="field-value">{{ roleLabel }}</span>
                    </div>
                    <div class="profile-field" *ngIf="allRoles.length > 1">
                        <span class="field-label">
                            <i class="pi pi-tags"></i> Tous les rôles
                        </span>
                        <div class="roles-wrap">
                            <span *ngFor="let r of allRoles" class="role-chip">{{ r }}</span>
                        </div>
                    </div>
                </div>

                <p-divider />

                <!-- Note info -->
                <div class="info-note">
                    <i class="pi pi-info-circle"></i>
                    Les informations du profil sont gérées par l'administrateur via Keycloak.
                    Pour modifier votre nom ou email, contactez l'administration.
                </div>

                <!-- Bouton changer mot de passe -->
                <p-button
                    label="Changer mon mot de passe"
                    icon="pi pi-key"
                    [outlined]="true"
                    severity="secondary"
                    styleClass="w-full mt-3"
                    (onClick)="changePassword()" />
            </div>
        </div>

        <!-- ========================================
             CARTE NOTIFICATIONS
             ======================================== -->
        <div class="settings-card notif-card">
            <div class="card-header">
                <i class="pi pi-bell card-icon"></i>
                <h2 class="card-title">Notifications par email</h2>
            </div>
            <p-divider />

            <!-- Skeleton pendant le chargement -->
            <div *ngIf="loading" class="notif-skeleton">
                <p-skeleton height="56px" styleClass="mb-3" />
                <p-skeleton height="56px" styleClass="mb-3" />
                <p-skeleton height="56px" />
            </div>

            <div *ngIf="!loading" class="notif-list">

                <!-- Invitations -->
                <div class="notif-row">
                    <div class="notif-info">
                        <div class="notif-icon-wrap" style="background:#e8f5e9">
                            <i class="pi pi-calendar-plus" style="color:#228B22"></i>
                        </div>
                        <div>
                            <div class="notif-label">Invitations à des événements</div>
                            <div class="notif-desc">
                                Recevoir un email quand vous êtes invité à un événement
                            </div>
                        </div>
                    </div>
                    <p-toggleSwitch
                        [(ngModel)]="settings.emailInvitationEnabled"
                        (onChange)="saveSettings()" />
                </div>

                <p-divider styleClass="my-0" />

                <!-- Validation / changement de statut -->
                <div class="notif-row">
                    <div class="notif-info">
                        <div class="notif-icon-wrap" style="background:#e3f2fd">
                            <i class="pi pi-check-circle" style="color:#2196F3"></i>
                        </div>
                        <div>
                            <div class="notif-label">Validation et statuts</div>
                            <div class="notif-desc">
                                Recevoir un email lors de la validation, du rejet ou de la
                                demande de corrections d'un événement
                            </div>
                        </div>
                    </div>
                    <p-toggleSwitch
                        [(ngModel)]="settings.emailValidationEnabled"
                        (onChange)="saveSettings()" />
                </div>

                <p-divider styleClass="my-0" />

                <!-- Rappels -->
                <div class="notif-row">
                    <div class="notif-info">
                        <div class="notif-icon-wrap" style="background:#fff3e0">
                            <i class="pi pi-clock" style="color:#ff9800"></i>
                        </div>
                        <div>
                            <div class="notif-label">Rappels avant événement</div>
                            <div class="notif-desc">
                                Recevoir un rappel automatique 24h avant un événement auquel
                                vous participez
                            </div>
                        </div>
                    </div>
                    <p-toggleSwitch
                        [(ngModel)]="settings.emailReminderEnabled"
                        (onChange)="saveSettings()" />
                </div>

            </div>

            <!-- Dernière mise à jour -->
            <div *ngIf="!loading && settings.updatedAt" class="last-updated">
                <i class="pi pi-history"></i>
                Dernière modification : {{ settings.updatedAt | date:'dd/MM/yyyy à HH:mm' }}
            </div>
        </div>

    </div>
</div>
    `,
})
export class SettingsComponent implements OnInit {

    loading = true;
    saving  = false;

    settings: UserSettings = {
        emailInvitationEnabled: true,
        emailValidationEnabled: true,
        emailReminderEnabled:   true
    };

    constructor(
        private authService:     AuthService,
        private settingsService: SettingsService,
        private keycloak:        KeycloakService,
        private messageService:  MessageService
    ) {}

    ngOnInit(): void {
        this.settingsService.getSettings().subscribe({
            next:  (s) => { this.settings = s; this.loading = false; },
            error: ()  => { this.loading = false; }
        });
    }

    saveSettings(): void {
        this.settingsService.updateSettings(this.settings).subscribe({
            next: (s) => {
                this.settings = s;
                this.messageService.add({
                    severity: 'success',
                    summary:  'Enregistré',
                    detail:   'Préférences mises à jour',
                    life: 2500
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   'Impossible d\'enregistrer les préférences'
                });
            }
        });
    }

    changePassword(): void {
        this.keycloak.login({ action: 'UPDATE_PASSWORD' });
    }

    // ==========================================
    // PROFIL (depuis le JWT Keycloak)
    // ==========================================
    get fullName():  string { return this.authService.fullName; }
    get username():  string { return this.authService.username; }
    get email():     string { return this.authService.email; }
    get allRoles():  string[] { return this.authService.roles.filter(r => !r.startsWith('default-') && r !== 'offline_access' && r !== 'uma_authorization'); }

    get primaryRole(): string {
        const priority = ['ADMIN','CGE','DIRECTEUR_CABINET','PROTOCOLE','SECRETAIRE','DELEGUE','USER'];
        return priority.find(r => this.authService.hasRole(r)) || this.allRoles[0] || 'USER';
    }

    get roleLabel(): string {
        const map: Record<string, string> = {
            'ADMIN':             'Administrateur',
            'CGE':               'CGE',
            'DIRECTEUR_CABINET': 'Directeur de Cabinet',
            'PROTOCOLE':         'Agent Protocole',
            'SECRETAIRE':        'Secrétaire',
            'DELEGUE':           'Délégué',
            'USER':              'Utilisateur'
        };
        return map[this.primaryRole] || this.primaryRole;
    }

    get roleColor(): string {
        const map: Record<string, string> = {
            'ADMIN':             '#f44336',
            'CGE':               '#228B22',
            'DIRECTEUR_CABINET': '#2196F3',
            'PROTOCOLE':         '#ff9800',
            'SECRETAIRE':        '#9c27b0',
            'DELEGUE':           '#00bcd4',
            'USER':              '#607d8b'
        };
        return map[this.primaryRole] || '#607d8b';
    }

    get avatarColor(): string { return this.roleColor; }

    get initials(): string {
        const f = this.authService.firstName.charAt(0);
        const l = this.authService.lastName.charAt(0);
        return (f + l).toUpperCase() || this.username.charAt(0).toUpperCase();
    }
}
