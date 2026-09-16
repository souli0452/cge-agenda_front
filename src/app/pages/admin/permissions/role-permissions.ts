import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PermissionService, PermissionCatalogEntry } from '../../../service/permission.service';

@Component({
    selector: 'app-role-permissions',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, SkeletonModule, ToastModule],
    providers: [MessageService],
    styleUrls: ['./role-permissions.css'],
    template: `
<p-toast position="top-right"></p-toast>

<div class="rp-container">
    <div class="page-header">
        <div class="header-left">
            <div class="header-icon"><i class="pi pi-shield"></i></div>
            <div>
                <h1 class="page-title">Rôles &amp; permissions</h1>
                <p class="page-subtitle">Ce que chaque rôle peut voir ou faire — modifiable sans redéploiement</p>
            </div>
        </div>
    </div>

    <div *ngIf="loading" class="skeleton-form">
        <p-skeleton height="36px" styleClass="mb-2" *ngFor="let i of [1,2,3,4,5,6]"></p-skeleton>
    </div>

    <div *ngIf="!loading" class="rp-table-wrap">
        <table class="rp-table">
            <thead>
                <tr>
                    <th class="rp-perm-col">Permission</th>
                    <th *ngFor="let role of roles" class="rp-role-col">
                        {{ role }}
                        <p-button icon="pi pi-save" [text]="true" [rounded]="true" size="small"
                                  [loading]="savingRole === role"
                                  pTooltip="Enregistrer les droits de ce rôle"
                                  (onClick)="saveRole(role)"></p-button>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let perm of catalogue">
                    <td class="rp-perm-col">
                        <div class="rp-perm-label">{{ perm.description }}</div>
                        <div class="rp-perm-key">{{ perm.cle }}</div>
                    </td>
                    <td *ngFor="let role of roles" class="rp-role-col">
                        <input type="checkbox"
                               [checked]="matrice[role]?.has(perm.cle)"
                               (change)="toggle(role, perm.cle)" />
                    </td>
                </tr>
            </tbody>
        </table>
        <div *ngIf="roles.length === 0" class="rp-empty">Aucun rôle Keycloak trouvé</div>
    </div>
</div>
    `
})
export class RolePermissionsComponent implements OnInit {

    loading = true;
    catalogue: PermissionCatalogEntry[] = [];
    roles: string[] = [];
    matrice: { [role: string]: Set<string> } = {};
    savingRole: string | null = null;

    constructor(
        private permissionService: PermissionService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.permissionService.getCatalogue().subscribe({
            next: (catalogue) => {
                this.catalogue = catalogue;
                this.permissionService.getMatrice().subscribe({
                    next: (matrice) => {
                        this.roles = Object.keys(matrice).sort();
                        this.matrice = {};
                        for (const role of this.roles) {
                            this.matrice[role] = new Set(matrice[role]);
                        }
                        this.loading = false;
                    },
                    error: () => { this.loading = false; }
                });
            },
            error: () => { this.loading = false; }
        });
    }

    toggle(role: string, permissionCle: string): void {
        const set = this.matrice[role] ?? new Set<string>();
        if (set.has(permissionCle)) { set.delete(permissionCle); } else { set.add(permissionCle); }
        this.matrice[role] = set;
    }

    saveRole(role: string): void {
        this.savingRole = role;
        const cles = Array.from(this.matrice[role] ?? []);
        this.permissionService.definirPermissionsDuRole(role, cles).subscribe({
            next: () => {
                this.savingRole = null;
                this.messageService.add({ severity: 'success', summary: 'Enregistré', detail: `Droits du rôle ${role} mis à jour`, life: 3000 });
            },
            error: () => {
                this.savingRole = null;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'enregistrer les droits' });
            }
        });
    }
}
