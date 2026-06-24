import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient }        from '@angular/common/http';

import { ButtonModule }        from 'primeng/button';
import { TableModule }         from 'primeng/table';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { DialogModule }        from 'primeng/dialog';
import { InputTextModule }     from 'primeng/inputtext';
import { SelectModule }        from 'primeng/select';
import { TooltipModule }       from 'primeng/tooltip';
import { SkeletonModule }      from 'primeng/skeleton';
import { IconFieldModule }     from 'primeng/iconfield';
import { InputIconModule }     from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule }       from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';

import { environments } from '../../../../environments/environments';
import { UserTableComponent } from './components/user-table/user-table';
import { UserFormDialogComponent } from './components/user-form-dialog/user-form-dialog';

// ==========================================
// MODÈLES
// ==========================================
interface KeycloakUser {
    id:               string | undefined;
    username:         string;
    email:            string;
    firstName:        string;
    lastName:         string;
    enabled:          boolean;
    emailVerified:    boolean;
    createdTimestamp: number;
    realmRoles?:      string[];
}

interface UserFormData {
    username:  string;
    email:     string;
    firstName: string;
    lastName:  string;
    password:  string;
    role:      string;
    enabled:   boolean;
}

interface KcRole {
    id:           string;
    name:         string;
    description?: string;
}

@Component({
    selector:    'app-admin-users',
    standalone:  true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, TableModule, TagModule,
        ToastModule, DialogModule, InputTextModule,
        SelectModule, TooltipModule, SkeletonModule,
        IconFieldModule, InputIconModule,
        ConfirmDialogModule, DividerModule,
        UserTableComponent, UserFormDialogComponent
    ],
    providers: [MessageService, ConfirmationService],
    styleUrls: ['./users.css'],
    template: `
<p-toast position="top-right"></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="admin-users-container">

    <!-- ============================================ -->
    <!-- EN-TÊTE                                      -->
    <!-- ============================================ -->
    <div class="page-header">
        <div class="header-left">
            <div class="header-icon">
                <i class="pi pi-users"></i>
            </div>
            <div>
                <h1 class="page-title">Gestion des utilisateurs</h1>
                <p class="page-subtitle">
                    {{ users.length }} utilisateur(s) — Keycloak asce-lc-realm
                </p>
            </div>
        </div>
        <div class="header-actions">
            <p-button
                label="Actualiser"
                icon="pi pi-refresh"
                [outlined]="true"
                severity="secondary"
                (onClick)="loadUsers()"
                [loading]="loading" />
            <p-button
                label="Gérer les rôles"
                icon="pi pi-tags"
                [outlined]="true"
                severity="help"
                (onClick)="openRolesMgmt()" />
            <p-button
                label="Nouvel utilisateur"
                icon="pi pi-plus"
                severity="success"
                (onClick)="openCreateDialog()" />
        </div>
    </div>

    <!-- ============================================ -->
    <!-- STATS PAR RÔLE                               -->
    <!-- ============================================ -->
    <div class="role-stats-grid">
        <div class="role-stat-card" *ngFor="let stat of roleStats">
            <div class="role-stat-bar" [style.background]="stat.color"></div>
            <div class="role-stat-count">{{ stat.count }}</div>
            <div class="role-stat-label">{{ stat.label }}</div>
        </div>
    </div>

    <!-- ============================================ -->
    <!-- FILTRES                                      -->
    <!-- ============================================ -->
    <div class="filters-bar">
        <p-iconfield iconPosition="left" class="filter-search">
            <p-inputicon styleClass="pi pi-search" />
            <input pInputText
                   [(ngModel)]="searchKeyword"
                   (input)="applyFilters()"
                   placeholder="Rechercher par nom, prénom ou email..."
                   class="w-full" />
        </p-iconfield>

        <p-select
            [options]="roleFilterOptions"
            [(ngModel)]="selectedRoleFilter"
            (onChange)="applyFilters()"
            placeholder="Tous les rôles"
            [showClear]="true"
            appendTo="body"
            styleClass="filter-select" />

        <p-select
            [options]="statusFilterOptions"
            [(ngModel)]="selectedStatusFilter"
            (onChange)="applyFilters()"
            placeholder="Tous les statuts"
            [showClear]="true"
            appendTo="body"
            styleClass="filter-select-sm" />

        <p-button
            label="Réinitialiser"
            icon="pi pi-times"
            [outlined]="true"
            severity="secondary"
            (onClick)="resetFilters()" />
    </div>

    <!-- ============================================ -->
    <!-- TABLEAU                                      -->
    <!-- ============================================ -->
    <div class="table-card">
        <app-user-table
            [users]="filteredUsers"
            [loading]="loading"
            [totalRecords]="filteredUsers.length"
            [rows]="20"
            (edit)="openEditDialog($event)"
            (delete)="confirmDelete($event)"
            (roleEdit)="openRolesDialog($event)"
            (resetPwd)="openResetPasswordDialog($event)">
        </app-user-table>
    </div>
</div>

<!-- ============================================ -->
<!-- DIALOG : CRÉER / MODIFIER                    -->
<!-- ============================================ -->
<app-user-form-dialog
    [(visible)]="userDialogVisible"
    [user]="selectedUser"
    [editMode]="editMode"
    (save)="onUserFormSave($event)">
</app-user-form-dialog>

<!-- ============================================ -->
<!-- DIALOG : RESET MOT DE PASSE                  -->
<!-- ============================================ -->
<p-dialog
    [(visible)]="resetPasswordDialogVisible"
    [modal]="true"
    [style]="{width: '440px'}"
    header="🔑 Réinitialiser le mot de passe"
    [draggable]="false">

    <div class="user-form">

        <div class="user-info-banner">
            <div class="user-avatar-sm"
                 [style.background]="selectedUser ? getAvatarColor(selectedUser) : '#228B22'">
                {{ selectedUser ? getInitials(selectedUser) : '' }}
            </div>
            <div>
                <div class="font-semibold">
                    {{ selectedUser?.firstName }} {{ selectedUser?.lastName }}
                </div>
                <div class="text-sm text-muted-color">
                    {{ selectedUser?.username }}
                </div>
            </div>
        </div>

        <div class="form-field">
            <label class="field-label">
                Nouveau mot de passe <span class="required">*</span>
            </label>
            <input pInputText
                   type="password"
                   [(ngModel)]="newPassword"
                   placeholder="Minimum 8 caractères"
                   class="w-full" />
            <small class="field-hint" *ngIf="newPassword && newPassword.length < 8">
                <i class="pi pi-exclamation-triangle" style="color:#f44336"></i>
                Minimum 8 caractères requis
            </small>
        </div>

        <div class="form-field">
            <label class="field-label">
                Confirmer le mot de passe <span class="required">*</span>
            </label>
            <input pInputText
                   type="password"
                   [(ngModel)]="confirmPassword"
                   placeholder="Répétez le mot de passe"
                   class="w-full" />
            <small class="field-error"
                   *ngIf="confirmPassword && newPassword !== confirmPassword">
                <i class="pi pi-times-circle"></i>
                Les mots de passe ne correspondent pas
            </small>
            <small class="field-success"
                   *ngIf="confirmPassword &&
                          newPassword === confirmPassword &&
                          newPassword.length >= 8">
                <i class="pi pi-check-circle"></i>
                Les mots de passe correspondent
            </small>
        </div>

    </div>

    <ng-template pTemplate="footer">
        <div class="dialog-footer">
            <p-button
                label="Annuler"
                [text]="true"
                severity="secondary"
                (onClick)="resetPasswordDialogVisible = false" />
            <p-button
                label="Réinitialiser"
                icon="pi pi-key"
                severity="warn"
                [loading]="actionLoading"
                [disabled]="!newPassword ||
                             newPassword !== confirmPassword ||
                             newPassword.length < 8"
                (onClick)="resetPassword()" />
        </div>
    </ng-template>
</p-dialog>

<!-- ============================================ -->
<!-- DIALOG : GESTION DES RÔLES REALM             -->
<!-- ============================================ -->
<p-dialog
    [(visible)]="rolesMgmtVisible"
    [modal]="true"
    [style]="{width: '580px', 'max-height': '85vh'}"
    header="Gestion des rôles Keycloak"
    [draggable]="false"
    [resizable]="false">

    <div class="user-form">

        <!-- Créer un nouveau rôle -->
        <div class="roles-create-section">
            <h4 class="section-label">Créer un rôle</h4>
            <div class="form-row-2">
                <div class="form-field" style="flex:1">
                    <label class="field-label">Nom du rôle <span class="required">*</span></label>
                    <input pInputText
                           [(ngModel)]="newRoleName"
                           placeholder="Ex: RESPONSABLE_TECHNIQUE"
                           class="w-full"
                           style="text-transform:uppercase"
                           (input)="newRoleName = newRoleName.toUpperCase()" />
                    <small class="field-hint">Lettres majuscules et underscores uniquement</small>
                </div>
                <div class="form-field" style="flex:1">
                    <label class="field-label">Description</label>
                    <input pInputText
                           [(ngModel)]="newRoleDesc"
                           placeholder="Description du rôle"
                           class="w-full" />
                </div>
            </div>
            <p-button
                label="Créer le rôle"
                icon="pi pi-plus"
                severity="success"
                [loading]="rolesLoading"
                [disabled]="!newRoleName.trim()"
                (onClick)="createRole()" />
        </div>

        <p-divider />

        <!-- Liste des rôles existants -->
        <h4 class="section-label">Rôles existants ({{ availableRoles.length }})</h4>
        <div class="roles-list">
            <div *ngFor="let role of availableRoles" class="roles-list-item">
                <div class="role-list-left">
                    <div class="role-badge"
                         [style.background]="getRoleColor(role.name) + '20'"
                         [style.color]="getRoleColor(role.name)"
                         [style.border]="'1px solid ' + getRoleColor(role.name) + '40'">
                        {{ role.name }}
                    </div>
                    <span class="role-desc-text" *ngIf="role.description">
                        {{ role.description }}
                    </span>
                </div>
                <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    size="small"
                    pTooltip="Supprimer ce rôle"
                    tooltipPosition="left"
                    (onClick)="confirmDeleteRole(role.name)" />
            </div>
            <div *ngIf="availableRoles.length === 0" class="empty-state" style="padding:20px 0">
                <i class="pi pi-tags" style="font-size:2rem;color:#ccc"></i>
                <p style="color:#999;margin-top:8px">Aucun rôle disponible</p>
            </div>
        </div>

    </div>

    <ng-template pTemplate="footer">
        <p-button
            label="Fermer"
            [text]="true"
            severity="secondary"
            (onClick)="rolesMgmtVisible = false" />
    </ng-template>
</p-dialog>

<!-- ============================================ -->
<!-- DIALOG : RÔLES D'UN UTILISATEUR              -->
<!-- ============================================ -->
<p-dialog
    [(visible)]="rolesDialogVisible"
    [modal]="true"
    [style]="{width: '500px'}"
    header="Rôles de l'utilisateur"
    [draggable]="false"
    [resizable]="false">

    <div class="user-form" *ngIf="selectedUserForRoles">

        <!-- Info utilisateur -->
        <div class="user-info-banner">
            <div class="user-avatar-sm"
                 [style.background]="getAvatarColor(selectedUserForRoles)">
                {{ getInitials(selectedUserForRoles) }}
            </div>
            <div>
                <div class="font-semibold">
                    {{ selectedUserForRoles.firstName }} {{ selectedUserForRoles.lastName }}
                </div>
                <div class="text-sm text-muted-color">{{ selectedUserForRoles.email }}</div>
            </div>
        </div>

        <!-- Rôles actuels -->
        <div class="form-field">
            <label class="field-label">Rôles actuels</label>
            <div class="current-roles-wrap" *ngIf="userCurrentRoles.length > 0; else noRoles">
                <div *ngFor="let r of userCurrentRoles" class="current-role-tag">
                    <span class="role-badge"
                          [style.background]="getRoleColor(r) + '20'"
                          [style.color]="getRoleColor(r)"
                          [style.border]="'1px solid ' + getRoleColor(r) + '40'">
                        {{ r }}
                    </span>
                    <p-button
                        icon="pi pi-times"
                        [rounded]="true"
                        [text]="true"
                        severity="danger"
                        size="small"
                        [pTooltip]="'Retirer ' + r"
                        tooltipPosition="top"
                        [loading]="rolesLoading"
                        (onClick)="removeRoleFromUser(r)" />
                </div>
            </div>
            <ng-template #noRoles>
                <p style="color:#999;font-style:italic">Aucun rôle assigné</p>
            </ng-template>
        </div>

        <!-- Assigner un rôle -->
        <div class="form-field">
            <label class="field-label">Assigner un rôle supplémentaire</label>
            <div style="display:flex;gap:8px;align-items:center">
                <p-select
                    [options]="assignableRoles"
                    [(ngModel)]="roleToAssign"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Sélectionnez un rôle"
                    [style]="{'flex':1}"
                    appendTo="body" />
                <p-button
                    label="Assigner"
                    icon="pi pi-plus"
                    severity="success"
                    [loading]="rolesLoading"
                    [disabled]="!roleToAssign"
                    (onClick)="assignRoleToUser()" />
            </div>
        </div>

    </div>

    <ng-template pTemplate="footer">
        <p-button
            label="Fermer"
            [text]="true"
            severity="secondary"
            (onClick)="rolesDialogVisible = false" />
    </ng-template>
</p-dialog>
    `,
})
export class AdminUsersComponent implements OnInit {

    loading       = false;
    actionLoading = false;

    users:         KeycloakUser[] = [];
    filteredUsers: KeycloakUser[] = [];

    searchKeyword        = '';
    selectedRoleFilter   = '';
    selectedStatusFilter = '';

    userDialogVisible          = false;
    resetPasswordDialogVisible = false;
    editMode                   = false;

    selectedUser:    KeycloakUser | null = null;
    newPassword      = '';
    confirmPassword  = '';

    userForm: UserFormData = this.emptyForm();

    // ==========================================
    // OPTIONS
    // ==========================================
    roleOptions = [
        { label: 'Administrateur',        value: 'ADMIN'             },
        { label: 'CGE',                   value: 'CGE'               },
        { label: 'Directeur de Cabinet',  value: 'DIRECTEUR_CABINET' },
        { label: 'Agent Protocole',       value: 'PROTOCOLE'         },
        { label: 'Secrétaire',            value: 'SECRETAIRE'        },
        { label: 'Délégué',               value: 'DELEGUE'           },
        { label: 'Utilisateur (lecture)', value: 'USER'              }
    ];

    roleFilterOptions = [
        { label: 'Administrateur',  value: 'ADMIN'             },
        { label: 'CGE',             value: 'CGE'               },
        { label: 'Dir. Cabinet',    value: 'DIRECTEUR_CABINET' },
        { label: 'Protocole',       value: 'PROTOCOLE'         },
        { label: 'Secrétaire',      value: 'SECRETAIRE'        },
        { label: 'Délégué',         value: 'DELEGUE'           },
        { label: 'Utilisateur',     value: 'USER'              }
    ];

    statusFilterOptions = [
        { label: 'Actif',   value: 'true'  },
        { label: 'Inactif', value: 'false' }
    ];

    roleStats: any[] = [];

    // Role management state
    availableRoles:       KcRole[]          = [];
    rolesDialogVisible:   boolean           = false;
    rolesMgmtVisible:     boolean           = false;
    selectedUserForRoles: KeycloakUser|null = null;
    userCurrentRoles:     string[]          = [];
    assignableRoles:      any[]             = [];
    roleToAssign:         string            = '';
    rolesLoading:         boolean           = false;
    newRoleName:          string            = '';
    newRoleDesc:          string            = '';

    constructor(
        private http:                HttpClient,
        private messageService:      MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.loadRoles();
    }

    // ==========================================
    // CHARGEMENT
    // ==========================================
    loadUsers(): void {
        this.loading = true;
        this.http.get<KeycloakUser[]>(
            `${environments.apiUrl}/admin/users`
        ).subscribe({
            next: (users) => {
                this.users         = users;
                this.filteredUsers = users;
                this.computeRoleStats();
                this.loading = false;
            },
            error: () => {
                this.users         = this.getDemoUsers();
                this.filteredUsers = this.users;
                this.computeRoleStats();
                this.loading = false;
                this.messageService.add({
                    severity: 'warn',
                    summary:  'Mode démo',
                    detail:   'API admin non disponible — données de démonstration',
                    life: 5000
                });
            }
        });
    }

    loadRoles(): void {
        this.http.get<KcRole[]>(`${environments.apiUrl}/admin/roles`).subscribe({
            next: (roles) => {
                this.availableRoles   = roles;
                this.roleOptions      = roles.map(r => ({ label: this.getRoleLabel(r.name), value: r.name }));
                this.roleFilterOptions = roles.map(r => ({ label: this.getRoleLabel(r.name), value: r.name }));
                this.computeRoleStats();
            },
            error: () => { /* conserve le fallback statique */ }
        });
    }

    private getDemoUsers(): KeycloakUser[] {
        return [
            {
                id: '1', username: 'admin.ascelc',
                email: 'admin@ascelc.bf',
                firstName: 'Admin', lastName: 'ASCELC',
                enabled: true, emailVerified: true,
                createdTimestamp: Date.now(),
                realmRoles: ['ADMIN']
            },
            {
                id: '2', username: 'cge.drabo',
                email: 'cge@ascelc.bf',
                firstName: 'Siakour', lastName: 'DRABO',
                enabled: true, emailVerified: true,
                createdTimestamp: Date.now(),
                realmRoles: ['CGE']
            },
            {
                id: '3', username: 'dir.cabinet',
                email: 'direction@ascelc.bf',
                firstName: 'Directeur', lastName: 'Cabinet',
                enabled: true, emailVerified: true,
                createdTimestamp: Date.now(),
                realmRoles: ['DIRECTEUR_CABINET']
            },
            {
                id: '4', username: 'protocole.ascelc',
                email: 'protocole@ascelc.bf',
                firstName: 'Agent', lastName: 'Protocole',
                enabled: true, emailVerified: true,
                createdTimestamp: Date.now(),
                realmRoles: ['PROTOCOLE']
            },
            {
                id: '5', username: 'secretaire.ascelc',
                email: 'secretariat@ascelc.bf',
                firstName: 'Aminata', lastName: 'OUEDRAOGO',
                enabled: false, emailVerified: false,
                createdTimestamp: Date.now(),
                realmRoles: ['SECRETAIRE']
            }
        ];
    }

    computeRoleStats(): void {
        const staticDefs = [
            { value: 'ADMIN',             label: 'Admin',     color: '#f44336' },
            { value: 'CGE',               label: 'CGE',       color: '#228B22' },
            { value: 'DIRECTEUR_CABINET', label: 'Directeur', color: '#2196F3' },
            { value: 'PROTOCOLE',         label: 'Protocole', color: '#ff9800' },
            { value: 'SECRETAIRE',        label: 'Secrétaire',color: '#9c27b0' },
            { value: 'USER',              label: 'User',      color: '#607d8b' }
        ];
        const defs = this.availableRoles.length > 0
            ? this.availableRoles.map(r => ({
                value: r.name,
                label: this.getRoleLabel(r.name),
                color: this.getRoleColor(r.name)
              }))
            : staticDefs;
        this.roleStats = defs.map(r => ({
            ...r,
            count: this.users.filter(u => u.realmRoles?.includes(r.value)).length
        })).filter(r => r.count > 0 || staticDefs.some(s => s.value === r.value));
    }

    // ==========================================
    // FILTRES
    // ==========================================
    applyFilters(): void {
        this.filteredUsers = this.users.filter(user => {
            const kw = this.searchKeyword.toLowerCase();
            const matchesKeyword = !kw ||
                user.username.toLowerCase().includes(kw)  ||
                user.email.toLowerCase().includes(kw)     ||
                (user.firstName || '').toLowerCase().includes(kw) ||
                (user.lastName  || '').toLowerCase().includes(kw);
            const matchesRole = !this.selectedRoleFilter ||
                user.realmRoles?.includes(this.selectedRoleFilter);
            const matchesStatus = !this.selectedStatusFilter ||
                String(user.enabled) === this.selectedStatusFilter;
            return matchesKeyword && matchesRole && matchesStatus;
        });
    }

    resetFilters(): void {
        this.searchKeyword        = '';
        this.selectedRoleFilter   = '';
        this.selectedStatusFilter = '';
        this.filteredUsers        = [...this.users];
    }

    // ==========================================
    // DIALOGS
    // ==========================================
    openCreateDialog(): void {
        this.editMode          = false;
        this.userForm          = this.emptyForm();
        this.userDialogVisible = true;
    }

    openEditDialog(user: any): void {
        this.editMode     = true;
        this.selectedUser = user;
        this.userForm = {
            username:  user.username,
            email:     user.email,
            firstName: user.firstName  || '',
            lastName:  user.lastName   || '',
            password:  '',
            role:      this.getPrimaryRole(user),
            enabled:   user.enabled
        };
        this.userDialogVisible = true;
    }

    onUserFormSave(data: any): void {
        if (this.editMode && this.selectedUser) {
            this.userForm = {
                username:  data.username  || this.selectedUser.username,
                email:     data.email,
                firstName: data.firstName,
                lastName:  data.lastName,
                password:  data.password  || '',
                role:      data.role,
                enabled:   data.enabled
            };
            this.saveUser();
        } else {
            this.userForm = {
                username:  data.username,
                email:     data.email,
                firstName: data.firstName,
                lastName:  data.lastName,
                password:  data.password,
                role:      data.role,
                enabled:   data.enabled
            };
            this.saveUser();
        }
    }

    openResetPasswordDialog(user: any): void {
        this.selectedUser            = user;
        this.newPassword             = '';
        this.confirmPassword         = '';
        this.resetPasswordDialogVisible = true;
    }

    // ==========================================
    // ACTIONS
    // ==========================================
    saveUser(): void {
        if (!this.isFormValid()) return;
        this.actionLoading = true;

        const payload: any = {
            username:  this.userForm.username,
            email:     this.userForm.email,
            firstName: this.userForm.firstName,
            lastName:  this.userForm.lastName,
            enabled:   this.userForm.enabled,
            role:      this.userForm.role
        };

        if (!this.editMode) {
            payload.password = this.userForm.password;
        }

        const request$ = this.editMode && this.selectedUser
            ? this.http.put(
                `${environments.apiUrl}/admin/users/${this.selectedUser.id}`,
                payload)
            : this.http.post(
                `${environments.apiUrl}/admin/users`,
                payload);

        request$.subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary:  this.editMode ? '✅ Modifié' : '✅ Créé',
                    detail:   `Utilisateur "${this.userForm.username}" ${this.editMode ? 'modifié' : 'créé'} avec succès`,
                    life: 4000
                });
                this.userDialogVisible = false;
                this.actionLoading     = false;
                this.loadUsers();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   err.error?.message || 'Impossible d\'enregistrer l\'utilisateur'
                });
                this.actionLoading = false;
            }
        });
    }

    toggleUserStatus(user: KeycloakUser): void {
        const newStatus = !user.enabled;
        this.http.patch(
            `${environments.apiUrl}/admin/users/${user.id}/status`,
            { enabled: newStatus }
        ).subscribe({
            next: () => {
                user.enabled = newStatus;
                this.messageService.add({
                    severity: newStatus ? 'success' : 'warn',
                    summary:  newStatus ? '✅ Activé' : '⚠️ Désactivé',
                    detail:   `"${user.username}" ${newStatus ? 'activé' : 'désactivé'}`,
                    life: 3000
                });
                this.computeRoleStats();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   err.error?.message || 'Impossible de modifier le statut'
                });
            }
        });
    }

    resetPassword(): void {
        if (!this.selectedUser ||
            !this.newPassword  ||
            this.newPassword !== this.confirmPassword ||
            this.newPassword.length < 8) return;

        this.actionLoading = true;
        this.http.patch(
            `${environments.apiUrl}/admin/users/${this.selectedUser.id}/reset-password`,
            { password: this.newPassword }
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary:  '✅ Mot de passe réinitialisé',
                    detail:   `Mot de passe de "${this.selectedUser?.username}" mis à jour`,
                    life: 4000
                });
                this.resetPasswordDialogVisible = false;
                this.actionLoading              = false;
                this.newPassword                = '';
                this.confirmPassword            = '';
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   err.error?.message || 'Impossible de réinitialiser le mot de passe'
                });
                this.actionLoading = false;
            }
        });
    }

    confirmDelete(user: any): void {
        this.confirmationService.confirm({
            message:               `Supprimer définitivement "${user.firstName} ${user.lastName}" (${user.username}) ?`,
            header:                'Confirmation de suppression',
            icon:                  'pi pi-exclamation-triangle',
            acceptLabel:           'Oui, supprimer',
            rejectLabel:           'Annuler',
            acceptButtonStyleClass:'p-button-danger',
            accept: ()             => this.deleteUser(user)
        });
    }

    deleteUser(user: KeycloakUser): void {
        this.http.delete(
            `${environments.apiUrl}/admin/users/${user.id}`
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary:  '✅ Supprimé',
                    detail:   `"${user.username}" supprimé avec succès`,
                    life: 3000
                });
                this.loadUsers();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary:  'Erreur',
                    detail:   err.error?.message || 'Impossible de supprimer l\'utilisateur'
                });
            }
        });
    }

    // ==========================================
    // GESTION DES RÔLES REALM
    // ==========================================
    openRolesMgmt(): void {
        this.newRoleName    = '';
        this.newRoleDesc    = '';
        this.rolesMgmtVisible = true;
    }

    createRole(): void {
        const name = this.newRoleName.trim().toUpperCase().replace(/\s+/g, '_');
        if (!name) return;
        this.rolesLoading = true;
        this.http.post(`${environments.apiUrl}/admin/roles`, { name, description: this.newRoleDesc }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: '✅ Rôle créé', detail: `Rôle "${name}" créé avec succès`, life: 3000 });
                this.newRoleName  = '';
                this.newRoleDesc  = '';
                this.rolesLoading = false;
                this.loadRoles();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.error || 'Impossible de créer le rôle' });
                this.rolesLoading = false;
            }
        });
    }

    confirmDeleteRole(roleName: string): void {
        this.confirmationService.confirm({
            message:                `Supprimer le rôle "${roleName}" de Keycloak ? Les utilisateurs gardent leurs accès jusqu'à reconnexion.`,
            header:                 'Supprimer le rôle',
            icon:                   'pi pi-exclamation-triangle',
            acceptLabel:            'Oui, supprimer',
            rejectLabel:            'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: ()              => this.deleteRole(roleName)
        });
    }

    deleteRole(roleName: string): void {
        this.rolesLoading = true;
        this.http.delete(`${environments.apiUrl}/admin/roles/${roleName}`).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: '✅ Supprimé', detail: `Rôle "${roleName}" supprimé`, life: 3000 });
                this.rolesLoading = false;
                this.loadRoles();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.error || 'Impossible de supprimer le rôle' });
                this.rolesLoading = false;
            }
        });
    }

    // ==========================================
    // GESTION DES RÔLES PAR UTILISATEUR
    // ==========================================
    openRolesDialog(user: any): void {
        this.selectedUserForRoles = user;
        this.roleToAssign         = '';
        this.rolesLoading         = true;
        this.rolesDialogVisible   = true;

        this.http.get<string[]>(`${environments.apiUrl}/admin/users/${user.id}/roles`).subscribe({
            next: (roles) => {
                this.userCurrentRoles = roles;
                this.refreshAssignableRoles();
                this.rolesLoading = false;
            },
            error: () => {
                this.userCurrentRoles = user.realmRoles || [];
                this.refreshAssignableRoles();
                this.rolesLoading = false;
            }
        });
    }

    private refreshAssignableRoles(): void {
        this.assignableRoles = this.availableRoles
            .filter(r => !this.userCurrentRoles.includes(r.name))
            .map(r => ({ label: `${r.name}${r.description ? ' — ' + r.description : ''}`, value: r.name }));
    }

    assignRoleToUser(): void {
        if (!this.selectedUserForRoles || !this.roleToAssign) return;
        this.rolesLoading = true;
        this.http.post(
            `${environments.apiUrl}/admin/users/${this.selectedUserForRoles.id}/roles/${this.roleToAssign}`,
            {}
        ).subscribe({
            next: () => {
                this.userCurrentRoles = [...this.userCurrentRoles, this.roleToAssign];
                if (this.selectedUserForRoles) {
                    this.selectedUserForRoles.realmRoles = [...this.userCurrentRoles];
                }
                this.messageService.add({ severity: 'success', summary: '✅ Rôle assigné', detail: `Rôle "${this.roleToAssign}" assigné`, life: 3000 });
                this.roleToAssign = '';
                this.refreshAssignableRoles();
                this.rolesLoading = false;
                this.computeRoleStats();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.error || 'Impossible d\'assigner le rôle' });
                this.rolesLoading = false;
            }
        });
    }

    removeRoleFromUser(roleName: string): void {
        if (!this.selectedUserForRoles) return;
        this.rolesLoading = true;
        this.http.delete(
            `${environments.apiUrl}/admin/users/${this.selectedUserForRoles.id}/roles/${roleName}`
        ).subscribe({
            next: () => {
                this.userCurrentRoles = this.userCurrentRoles.filter(r => r !== roleName);
                if (this.selectedUserForRoles) {
                    this.selectedUserForRoles.realmRoles = [...this.userCurrentRoles];
                }
                this.messageService.add({ severity: 'success', summary: '✅ Rôle retiré', detail: `Rôle "${roleName}" retiré`, life: 3000 });
                this.refreshAssignableRoles();
                this.rolesLoading = false;
                this.computeRoleStats();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.error || 'Impossible de retirer le rôle' });
                this.rolesLoading = false;
            }
        });
    }

    // ==========================================
    // HELPERS
    // ==========================================
    emptyForm(): UserFormData {
        return {
            username: '', email: '',
            firstName: '', lastName: '',
            password: '', role: 'SECRETAIRE',
            enabled: true
        };
    }

    isFormValid(): boolean {
        return !!(
            this.userForm.firstName?.trim() &&
            this.userForm.lastName?.trim()  &&
            this.userForm.username?.trim()  &&
            this.userForm.email?.trim()     &&
            this.userForm.role              &&
            (this.editMode || (this.userForm.password?.length >= 8))
        );
    }

    getPrimaryRole(user: KeycloakUser): string {
        const priority = ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                          'PROTOCOLE', 'SECRETAIRE', 'DELEGUE', 'USER'];
        for (const r of priority) {
            if (user.realmRoles?.includes(r)) return r;
        }
        return user.realmRoles?.[0] || 'USER';
    }

    getRoleLabel(role: string): string {
        const map: Record<string, string> = {
            'ADMIN':             'Administrateur',
            'CGE':               'CGE',
            'DIRECTEUR_CABINET': 'Dir. Cabinet',
            'PROTOCOLE':         'Protocole',
            'SECRETAIRE':        'Secrétaire',
            'DELEGUE':           'Délégué',
            'USER':              'Utilisateur'
        };
        return map[role] || role;
    }

    getRoleColor(role: string): string {
        const map: Record<string, string> = {
            'ADMIN':             '#f44336',
            'CGE':               '#228B22',
            'DIRECTEUR_CABINET': '#2196F3',
            'PROTOCOLE':         '#ff9800',
            'SECRETAIRE':        '#9c27b0',
            'DELEGUE':           '#00bcd4',
            'USER':              '#607d8b'
        };
        return map[role] || '#607d8b';
    }

    getRoleSeverity(role: string): any {
        const map: Record<string, string> = {
            'ADMIN':             'danger',
            'CGE':               'success',
            'DIRECTEUR_CABINET': 'info',
            'PROTOCOLE':         'warn',
            'SECRETAIRE':        'secondary',
            'DELEGUE':           'help',
            'USER':              'contrast'
        };
        return map[role] || 'secondary';
    }

    getRoleDescription(role: string): string {
        const map: Record<string, string> = {
            'ADMIN':             'Accès total — gestion système et utilisateurs',
            'CGE':               'Valide, rejette et gère les événements',
            'DIRECTEUR_CABINET': 'Crée des événements → soumis à validation CGE',
            'PROTOCOLE':         'Crée des événements → soumis à validation CGE',
            'SECRETAIRE':        'Crée des événements → soumis à validation CGE',
            'DELEGUE':           'Remplaçant désigné — accès limité',
            'USER':              'Consultation uniquement — lecture seule'
        };
        return map[role] || '';
    }

    getAvatarColor(user: KeycloakUser): string {
        return this.getRoleColor(this.getPrimaryRole(user));
    }

    getInitials(user: KeycloakUser): string {
        const f = (user.firstName || '').charAt(0);
        const l = (user.lastName  || '').charAt(0);
        return (f + l).toUpperCase() ||
               user.username.charAt(0).toUpperCase();
    }
}

