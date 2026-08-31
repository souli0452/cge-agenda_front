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
import { MessageService, ConfirmationService } from 'primeng/api';

import { EspaceService, Espace } from '../../../service/espace.service';

@Component({
    selector: 'app-admin-espaces',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
        InputTextModule, ToastModule, SkeletonModule, ConfirmDialogModule
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
                    <th style="width:100px"></th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-espace>
                <tr>
                    <td>{{ espace.nom }}</td>
                    <td>{{ espace.chefNom || '—' }}</td>
                    <td>{{ espace.chefEmail }}</td>
                    <td>
                        <p-button icon="pi pi-users" [text]="true" [rounded]="true" size="small"
                                  pTooltip="Gérer les gestionnaires" (onClick)="goToTeam(espace)"></p-button>
                        <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger"
                                  pTooltip="Supprimer" (onClick)="confirmDelete(espace)"></p-button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr><td colspan="4" style="text-align:center;padding:40px">Aucun espace créé</td></tr>
            </ng-template>
        </p-table>
    </div>
</div>

<p-dialog [(visible)]="createDialogVisible" [modal]="true" header="Nouvel espace" [style]="{width:'480px'}">
    <div class="form-field">
        <label class="field-label">Nom de l'espace <span class="text-red-500">*</span></label>
        <input pInputText [(ngModel)]="newNom" class="w-full" placeholder="Ex: Cabinet du Directeur X" />
    </div>
    <div class="form-field">
        <label class="field-label">Nom du chef</label>
        <input pInputText [(ngModel)]="newChefNom" class="w-full" placeholder="Ex: Jean Dupont" />
    </div>
    <div class="form-field">
        <label class="field-label">Email du chef <span class="text-red-500">*</span></label>
        <input pInputText [(ngModel)]="newChefEmail" class="w-full" placeholder="chef@asce-lc.bf" type="email" />
        <small class="field-hint">Cette personne devient propriétaire de l'espace (tous droits, création directement confirmée).</small>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="createDialogVisible = false"></p-button>
        <p-button label="Créer" severity="success" [loading]="creating"
                  [disabled]="!newNom.trim() || !newChefEmail.trim()" (onClick)="create()"></p-button>
    </ng-template>
</p-dialog>
    `
})
export class AdminEspacesComponent implements OnInit {

    espaces: Espace[] = [];
    loading = true;

    createDialogVisible = false;
    creating = false;
    newNom = '';
    newChefNom = '';
    newChefEmail = '';

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
        this.newNom = '';
        this.newChefNom = '';
        this.newChefEmail = '';
        this.createDialogVisible = true;
    }

    create(): void {
        this.creating = true;
        this.espaceService.createEspace(this.newNom.trim(), this.newChefEmail.trim(), this.newChefNom.trim()).subscribe({
            next: () => {
                this.creating = false;
                this.createDialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Créé', detail: 'Espace créé', life: 3000 });
                this.load();
            },
            error: (err: any) => {
                this.creating = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de créer l\'espace' });
            }
        });
    }

    confirmDelete(espace: Espace): void {
        this.confirmationService.confirm({
            message: `Supprimer l'espace "${espace.nom}" ? Les événements existants resteront rattachés à cet espace supprimé.`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.espaceService.deleteEspace(espace.id).subscribe({
                    next: () => { this.load(); },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer' })
                });
            }
        });
    }

    goToTeam(espace: Espace): void {
        this.router.navigate(['/espaces', espace.id, 'equipe']);
    }
}
