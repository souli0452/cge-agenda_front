import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EspaceService, Espace } from '../../../service/espace.service';

@Component({
    selector: 'app-admin-espaces',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
        InputTextModule, ToastModule, SkeletonModule, ConfirmDialogModule, TooltipModule
    ],
    providers: [MessageService, ConfirmationService],
    styleUrls: ['./espaces.css'],
    template: `
<p-toast position="top-right"></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="espaces-container">
    <div class="page-header">
        <div class="header-left">
            <div class="header-icon"><i class="pi pi-briefcase"></i></div>
            <div>
                <h1 class="page-title">Espaces agenda</h1>
                <p class="page-subtitle">Un espace cloisonné par chef — CGE compris, sans exception codée</p>
            </div>
        </div>
        <p-button label="Nouvel espace" icon="pi pi-plus" severity="success" (onClick)="openCreateDialog()"></p-button>
    </div>

    <div *ngIf="loading" class="skeleton-form">
        <p-skeleton height="44px" styleClass="mb-2" *ngFor="let i of [1,2,3]"></p-skeleton>
    </div>

    <div *ngIf="!loading" class="card">
        <p-table [value]="espaces" responsiveLayout="scroll" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
                <tr>
                    <th>Espace</th>
                    <th>Chef</th>
                    <th>Email du chef</th>
                    <th style="width:110px">Statut</th>
                    <th style="width:140px"></th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-espace>
                <tr [class.espace-inactif]="!espace.actif">
                    <td>{{ espace.nom }}</td>
                    <td>{{ espace.chefNom || '—' }}</td>
                    <td>{{ espace.chefEmail }}</td>
                    <td>
                        <span class="statut-badge" [class.statut-actif]="espace.actif" [class.statut-inactif]="!espace.actif">
                            {{ espace.actif ? 'Actif' : 'Inactif' }}
                        </span>
                    </td>
                    <td>
                        <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" size="small"
                                  pTooltip="Modifier" (onClick)="openEditDialog(espace)"></p-button>
                        <p-button icon="pi pi-users" [text]="true" [rounded]="true" size="small"
                                  pTooltip="Gérer les gestionnaires" (onClick)="goToTeam(espace)"></p-button>
                        <p-button [icon]="espace.actif ? 'pi pi-ban' : 'pi pi-check'" [text]="true" [rounded]="true" size="small"
                                  [severity]="espace.actif ? 'danger' : 'success'"
                                  [pTooltip]="espace.actif ? 'Désactiver' : 'Réactiver'" (onClick)="confirmToggleActif(espace)"></p-button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="5" style="text-align:center;padding:40px">Aucun espace créé</td></tr>
            </ng-template>
        </p-table>
    </div>
</div>

<p-dialog [(visible)]="formDialogVisible" [modal]="true" [header]="editingEspace ? 'Modifier l\\'espace' : 'Nouvel espace'" [style]="{width:'480px'}">
    <div class="form-field">
        <label class="field-label">Nom de l'espace <span class="text-red-500">*</span></label>
        <input pInputText [(ngModel)]="formNom" class="w-full" placeholder="Ex: Cabinet du Directeur X" />
    </div>
    <div class="form-field">
        <label class="field-label">Nom du chef</label>
        <input pInputText [(ngModel)]="formChefNom" class="w-full" placeholder="Ex: Jean Dupont" />
    </div>
    <div class="form-field">
        <label class="field-label">Email du chef <span class="text-red-500">*</span></label>
        <input pInputText [(ngModel)]="formChefEmail" class="w-full" placeholder="chef@asce-lc.bf" type="email" />
        <small class="field-hint">Cette personne devient propriétaire de l'espace (tous droits, création directement confirmée).</small>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="formDialogVisible = false"></p-button>
        <p-button [label]="editingEspace ? 'Enregistrer' : 'Créer'" severity="success" [loading]="saving"
                  [disabled]="!formNom.trim() || !formChefEmail.trim()" (onClick)="save()"></p-button>
    </ng-template>
</p-dialog>
    `
})
export class AdminEspacesComponent implements OnInit {

    espaces: Espace[] = [];
    loading = true;

    formDialogVisible = false;
    saving = false;
    editingEspace: Espace | null = null;
    formNom = '';
    formChefNom = '';
    formChefEmail = '';

    constructor(
        private espaceService: EspaceService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading = true;
        this.espaceService.getAllEspaces().subscribe({
            next: (espaces) => { this.espaces = espaces; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    openCreateDialog(): void {
        this.editingEspace = null;
        this.formNom = '';
        this.formChefNom = '';
        this.formChefEmail = '';
        this.formDialogVisible = true;
    }

    openEditDialog(espace: Espace): void {
        this.editingEspace = espace;
        this.formNom = espace.nom;
        this.formChefNom = espace.chefNom || '';
        this.formChefEmail = espace.chefEmail;
        this.formDialogVisible = true;
    }

    save(): void {
        this.saving = true;
        const nom = this.formNom.trim();
        const chefEmail = this.formChefEmail.trim();
        const chefNom = this.formChefNom.trim();
        const request$ = this.editingEspace
            ? this.espaceService.updateEspace(this.editingEspace.id, nom, chefEmail, chefNom)
            : this.espaceService.createEspace(nom, chefEmail, chefNom);

        request$.subscribe({
            next: () => {
                this.saving = false;
                this.formDialogVisible = false;
                this.messageService.add({
                    severity: 'success',
                    summary: this.editingEspace ? 'Modifié' : 'Créé',
                    detail: this.editingEspace ? 'Espace modifié' : 'Espace créé',
                    life: 3000
                });
                this.load();
            },
            error: (err: any) => {
                this.saving = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible d\'enregistrer l\'espace' });
            }
        });
    }

    confirmToggleActif(espace: Espace): void {
        const nouveauStatut = !espace.actif;
        this.confirmationService.confirm({
            message: nouveauStatut
                ? `Réactiver l'espace "${espace.nom}" ?`
                : `Désactiver l'espace "${espace.nom}" ? Il ne sera plus possible d'y créer de nouveaux événements ; l'historique existant est conservé.`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.espaceService.setEspaceActif(espace.id, nouveauStatut).subscribe({
                    next: () => { this.load(); },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de modifier le statut' })
                });
            }
        });
    }

    goToTeam(espace: Espace): void {
        this.router.navigate(['/espaces', espace.id, 'equipe']);
    }
}
