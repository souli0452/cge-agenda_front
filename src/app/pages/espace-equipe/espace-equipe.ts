import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EspaceService, MembreEspace } from '../../service/espace.service';

@Component({
    selector: 'app-espace-equipe',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule,
        SelectModule, ToastModule, TagModule, SkeletonModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    styleUrls: ['./espace-equipe.css'],
    template: `
<p-toast position="top-right"></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="equipe-container">
    <div class="page-header">
        <div class="header-left">
            <div class="header-icon"><i class="pi pi-users"></i></div>
            <div>
                <h1 class="page-title">Mon équipe</h1>
                <p class="page-subtitle">Personnes autorisées à gérer votre espace agenda (secrétaire, protocole)</p>
            </div>
        </div>
        <p-button label="Ajouter un gestionnaire" icon="pi pi-user-plus" severity="success" (onClick)="openAddDialog()"></p-button>
    </div>

    <div *ngIf="loading" class="skeleton-form">
        <p-skeleton height="60px" styleClass="mb-2" *ngFor="let i of [1,2,3]"></p-skeleton>
    </div>

    <div *ngIf="!loading" class="card">
        <div *ngFor="let m of membres" class="membre-row">
            <div class="membre-info">
                <div class="membre-nom">{{ m.membreNom || m.membreEmail }}</div>
                <div class="membre-email">{{ m.membreEmail }}</div>
            </div>
            <p-tag [value]="m.role === 'SECRETAIRE' ? 'Secrétaire' : 'Protocole'" severity="info"></p-tag>
            <p-tag [value]="m.statut === 'ACTIF' ? 'Actif' : 'Invité'"
                   [severity]="m.statut === 'ACTIF' ? 'success' : 'warn'"></p-tag>
            <p-button icon="pi pi-trash" [text]="true" [rounded]="true" size="small" severity="danger"
                      pTooltip="Retirer" (onClick)="confirmRemove(m)"></p-button>
        </div>
        <div *ngIf="membres.length === 0" class="empty">Aucun gestionnaire pour le moment</div>
    </div>
</div>

<p-dialog [(visible)]="addDialogVisible" [modal]="true" header="Ajouter un gestionnaire" [style]="{width:'480px'}">
    <div class="form-field">
        <label class="field-label">Nom</label>
        <input pInputText [(ngModel)]="newNom" class="w-full" placeholder="Ex: Aïcha Traoré" />
    </div>
    <div class="form-field">
        <label class="field-label">Email <span class="text-red-500">*</span></label>
        <input pInputText [(ngModel)]="newEmail" class="w-full" placeholder="email@asce-lc.bf" type="email" />
    </div>
    <div class="form-field">
        <label class="field-label">Rôle <span class="text-red-500">*</span></label>
        <p-select [options]="roleOptions" [(ngModel)]="newRole" optionLabel="label" optionValue="value"
                  placeholder="Choisir un rôle" class="w-full" appendTo="body"></p-select>
        <small class="field-hint">Un email lui sera envoyé avec un lien pour accéder à cet espace.</small>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="addDialogVisible = false"></p-button>
        <p-button label="Ajouter" severity="success" [loading]="adding"
                  [disabled]="!newEmail.trim() || !newRole" (onClick)="add()"></p-button>
    </ng-template>
</p-dialog>
    `
})
export class EspaceEquipeComponent implements OnInit {

    espaceId = '';
    membres: MembreEspace[] = [];
    loading = true;

    addDialogVisible = false;
    adding = false;
    newNom = '';
    newEmail = '';
    newRole: 'SECRETAIRE' | 'PROTOCOLE' | null = null;

    roleOptions = [
        { label: 'Secrétaire', value: 'SECRETAIRE' },
        { label: 'Protocole', value: 'PROTOCOLE' }
    ];

    constructor(
        private route: ActivatedRoute,
        private espaceService: EspaceService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.espaceId = this.route.snapshot.paramMap.get('id') || '';
        this.load();
    }

    load(): void {
        if (!this.espaceId) return;
        this.loading = true;
        this.espaceService.getMembres(this.espaceId).subscribe({
            next: (membres) => { this.membres = membres; this.loading = false; },
            error: () => { this.loading = false; }
        });
    }

    openAddDialog(): void {
        this.newNom = '';
        this.newEmail = '';
        this.newRole = null;
        this.addDialogVisible = true;
    }

    add(): void {
        if (!this.newRole) return;
        this.adding = true;
        this.espaceService.ajouterMembre(this.espaceId, this.newEmail.trim(), this.newNom.trim(), this.newRole).subscribe({
            next: () => {
                this.adding = false;
                this.addDialogVisible = false;
                this.messageService.add({ severity: 'success', summary: 'Ajouté', detail: 'Invitation envoyée', life: 3000 });
                this.load();
            },
            error: (err: any) => {
                this.adding = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible d\'ajouter ce gestionnaire' });
            }
        });
    }

    confirmRemove(m: MembreEspace): void {
        this.confirmationService.confirm({
            message: `Retirer ${m.membreNom || m.membreEmail} de cet espace ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.espaceService.retirerMembre(this.espaceId, m.id).subscribe({
                    next: () => this.load(),
                    error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de retirer ce gestionnaire' })
                });
            }
        });
    }
}
