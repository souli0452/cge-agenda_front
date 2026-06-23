import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule }        from 'primeng/button';
import { TableModule }         from 'primeng/table';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { DialogModule }        from 'primeng/dialog';
import { TextareaModule }      from 'primeng/textarea';
import { TooltipModule }       from 'primeng/tooltip';
import { SkeletonModule }      from 'primeng/skeleton';
import { BadgeModule }         from 'primeng/badge';
import { MessageService }      from 'primeng/api';

import { EventService }  from '../../service/event.service';
import { AuthService }   from '../../service/auth.service';
import {
    Event,
    EventTypeLabels,
    getEventTypeSeverity,
    TagSeverity
} from '../../models';

@Component({
    selector: 'app-validation-dashboard',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, TableModule, TagModule,
        ToastModule, DialogModule, TextareaModule,
        TooltipModule, SkeletonModule, BadgeModule
    ],
    providers: [MessageService],
    template: `
<p-toast></p-toast>

<div class="validation-dashboard">

    <!-- EN-TÊTE -->
    <div class="card mb-4">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="validation-header-icon">
                        <i class="pi pi-shield"></i>
                    </div>
                    <div>
                        <h3 class="m-0 text-2xl font-bold">
                            Validation des événements
                        </h3>
                        <p class="m-0 text-sm text-muted-color">
                            Événements en attente de votre validation
                        </p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="attente-badge" *ngIf="pendingEvents.length > 0">
                    <i class="pi pi-exclamation-circle"></i>
                    {{ pendingEvents.length }} en attente
                </div>
                <div class="corriger-badge" *ngIf="aCorrigerEvents.length > 0">
                    <i class="pi pi-wrench"></i>
                    {{ aCorrigerEvents.length }} à corriger
                </div>
                <p-button label="Rafraîchir" icon="pi pi-refresh"
                          [outlined]="true" (onClick)="loadPendingEvents()"
                          [loading]="loading" />
            </div>
        </div>
    </div>

    <!-- STATS -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-3">
            <div class="stat-card stat-card-orange">
                <div class="stat-icon"><i class="pi pi-clock"></i></div>
                <div class="stat-info">
                    <div class="stat-value">{{ pendingEvents.length }}</div>
                    <div class="stat-label">En attente</div>
                </div>
            </div>
        </div>
        <div class="col-span-12 md:col-span-3">
            <div class="stat-card stat-card-green">
                <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
                <div class="stat-info">
                    <div class="stat-value">{{ validatedToday }}</div>
                    <div class="stat-label">Validés aujourd'hui</div>
                </div>
            </div>
        </div>
        <div class="col-span-12 md:col-span-3">
            <div class="stat-card stat-card-red">
                <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
                <div class="stat-info">
                    <div class="stat-value">{{ rejectedToday }}</div>
                    <div class="stat-label">Rejetés aujourd'hui</div>
                </div>
            </div>
        </div>
        <div class="col-span-12 md:col-span-3">
            <div class="stat-card stat-card-blue">
                <div class="stat-icon"><i class="pi pi-calendar"></i></div>
                <div class="stat-info">
                    <div class="stat-value">{{ urgentEvents.length }}</div>
                    <div class="stat-label">Urgents (&lt; 7 jours)</div>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION À CORRIGER -->
    <div class="card mb-4" *ngIf="aCorrigerEvents.length > 0">
        <div class="flex justify-between items-center mb-4">
            <h5 class="m-0 font-bold">
                <i class="pi pi-wrench mr-2" style="color:#f44336"></i>
                Événements en attente de corrections
            </h5>
            <span class="text-sm text-muted-color">Corrections demandées — en attente de re-soumission du créateur</span>
        </div>
        <p-table [value]="aCorrigerEvents"
                 responsiveLayout="scroll"
                 styleClass="p-datatable-sm p-datatable-hoverable-rows"
                 [tableStyle]="{'min-width': '60rem'}">
            <ng-template pTemplate="header">
                <tr>
                    <th style="width:30%">Événement</th>
                    <th style="width:10%">Type</th>
                    <th style="width:15%">Dates</th>
                    <th style="width:15%">Créateur</th>
                    <th style="width:30%">Corrections demandées</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-rowEvent>
                <tr (click)="viewEvent(rowEvent)" style="cursor:pointer; background:#fff8f8;">
                    <td>
                        <span class="font-semibold">{{ rowEvent.title }}</span>
                        <span class="badge-corriger ml-2">
                            <i class="pi pi-wrench"></i> À corriger
                        </span>
                    </td>
                    <td>
                        <p-tag [value]="getTypeLabel(rowEvent.type)"
                               [severity]="getTypeSeverity(rowEvent.type)" [rounded]="true" />
                    </td>
                    <td>
                        <span class="text-sm">{{ rowEvent.startDate | date:'dd/MM/yyyy' }}</span>
                    </td>
                    <td>
                        <span class="text-sm">{{ rowEvent.creatorUsername || '—' }}</span>
                    </td>
                    <td>
                        <span class="text-sm" style="color:#555; font-style:italic;">
                            {{ rowEvent.changeSuggestions | slice:0:100 }}{{ rowEvent.changeSuggestions?.length > 100 ? '...' : '' }}
                        </span>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <!-- TABLEAU -->
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h5 class="m-0 font-bold">
                <i class="pi pi-list mr-2" style="color: #ff9800"></i>
                Événements en attente de validation
            </h5>
            <span class="text-sm text-muted-color">
                Cliquez sur une ligne pour voir les détails
            </span>
        </div>

        <div *ngIf="loading" class="flex flex-col gap-3">
            <p-skeleton height="60px" *ngFor="let i of [1,2,3]" />
        </div>

        <div *ngIf="!loading && pendingEvents.length === 0" class="empty-validation">
            <i class="pi pi-check-circle empty-icon"></i>
            <h4>Aucun événement en attente</h4>
            <p>Tous les événements ont été traités.</p>
        </div>

        <p-table *ngIf="!loading && pendingEvents.length > 0"
                 [value]="pendingEvents"
                 responsiveLayout="scroll"
                 styleClass="p-datatable-sm p-datatable-hoverable-rows"
                 [tableStyle]="{'min-width': '60rem'}">

            <ng-template pTemplate="header">
                <tr>
                    <th style="width:25%">Événement</th>
                    <th style="width:10%">Type</th>
                    <th style="width:12%">Dates</th>
                    <th style="width:12%">Lieu</th>
                    <th style="width:12%">Créateur</th>
                    <th style="width:8%" class="text-center">Part.</th>
                    <th style="width:10%" class="text-center">Délai</th>
                    <th style="width:11%" class="text-center">Actions</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-rowEvent>
                <!-- ✅ Clic sur ligne → détail avec stopPropagation sur Actions -->
                <tr [class.row-urgent]="isUrgent(rowEvent)"
                    (click)="viewEvent(rowEvent)"
                    style="cursor:pointer">

                    <td>
                        <div class="flex flex-col gap-1">
                            <span class="font-semibold">{{ rowEvent.title }}</span>
                            <span class="text-xs text-muted-color" *ngIf="rowEvent.description">
                                {{ rowEvent.description | slice:0:60 }}{{ rowEvent.description.length > 60 ? '...' : '' }}
                            </span>
                            <span class="badge-urgent" *ngIf="isUrgent(rowEvent)">
                                <i class="pi pi-exclamation-triangle"></i>
                                Urgent — {{ getDaysUntilStart(rowEvent) }} jour(s)
                            </span>
                        </div>
                    </td>

                    <td>
                        <p-tag [value]="getTypeLabel(rowEvent.type)"
                               [severity]="getTypeSeverity(rowEvent.type)"
                               [rounded]="true" />
                    </td>

                    <td>
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-1">
                                <i class="pi pi-calendar text-xs text-muted-color"></i>
                                <span class="text-sm font-medium">
                                    {{ rowEvent.startDate | date:'dd/MM/yyyy' }}
                                </span>
                            </div>
                            <span class="text-xs text-muted-color"
                                  *ngIf="rowEvent.endDate !== rowEvent.startDate">
                                → {{ rowEvent.endDate | date:'dd/MM/yyyy' }}
                            </span>
                        </div>
                    </td>

                    <td>
                        <span class="text-sm">{{ getLieuDisplay(rowEvent) }}</span>
                    </td>

                    <td>
                        <div class="flex flex-col gap-1">
                            <span class="text-sm font-medium">{{ rowEvent.creatorUsername || '—' }}</span>
                            <span class="text-xs text-muted-color">{{ getRoleLabel(rowEvent.creatorRole) }}</span>
                        </div>
                    </td>

                    <td class="text-center">
                        <div class="inline-flex items-center gap-1 px-2 py-1"
                             style="background:rgba(66,165,245,0.1);border-radius:8px;color:#2196F3">
                            <i class="pi pi-users text-xs"></i>
                            <span class="font-semibold text-sm">{{ rowEvent.participants?.length || 0 }}</span>
                        </div>
                    </td>

                    <td class="text-center">
                        <span [class]="getDelaiClass(rowEvent)">
                            {{ getDaysUntilStart(rowEvent) }}j
                        </span>
                    </td>

                    <!-- ✅ stopPropagation sur colonne Actions -->
                    <td class="text-center" (click)="$event.stopPropagation()">
                        <div class="flex justify-center gap-1">
                            <p-button icon="pi pi-eye"
                                      [rounded]="true" [text]="true"
                                      severity="secondary" size="small"
                                      pTooltip="Voir détails"
                                      (onClick)="viewEvent(rowEvent)" />
                            <p-button icon="pi pi-check"
                                      [rounded]="true" [text]="true"
                                      severity="success" size="small"
                                      pTooltip="Valider"
                                      (onClick)="openValidateDialog(rowEvent)" />
                            <p-button icon="pi pi-wrench"
                                      [rounded]="true" [text]="true"
                                      severity="warn" size="small"
                                      pTooltip="Demander modifications"
                                      (onClick)="openChangesDialog(rowEvent)" />
                            <p-button icon="pi pi-times"
                                      [rounded]="true" [text]="true"
                                      severity="danger" size="small"
                                      pTooltip="Rejeter"
                                      (onClick)="openRejectDialog(rowEvent)" />
                        </div>
                    </td>

                </tr>
            </ng-template>

        </p-table>
    </div>
</div>

<!-- DIALOG : VALIDER -->
<p-dialog [(visible)]="validateDialogVisible"
          [modal]="true" [style]="{width: '520px'}"
          header="Valider l'événement">
    <div class="dialog-content">
        <div class="event-info-banner banner-green">
            <div class="font-bold mb-1">{{ selectedEvent?.title }}</div>
            <div class="text-sm">
                {{ selectedEvent?.startDate | date:'dd/MM/yyyy' }}
                → {{ selectedEvent?.endDate | date:'dd/MM/yyyy' }}
            </div>
        </div>
        <div class="mb-4">
            <label class="block font-semibold mb-2">
                Commentaire <span class="font-normal text-muted-color">(optionnel)</span>
            </label>
            <textarea pTextarea [(ngModel)]="validateComment" rows="4"
                      placeholder="Ajoutez un commentaire pour le créateur..."
                      class="w-full"></textarea>
        </div>
        <div class="info-note">
            <i class="pi pi-info-circle"></i>
            <span>Le créateur sera notifié. Les invitations seront envoyées aux participants.</span>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary"
                  (onClick)="validateDialogVisible = false" />
        <p-button label="Confirmer la validation" icon="pi pi-check"
                  severity="success" [loading]="actionLoading"
                  (onClick)="validateEvent()" />
    </ng-template>
</p-dialog>

<!-- DIALOG : DEMANDER MODIFICATIONS -->
<p-dialog [(visible)]="changesDialogVisible"
          [modal]="true" [style]="{width: '520px'}"
          header="Demander des modifications">
    <div class="dialog-content">
        <div class="event-info-banner banner-orange">
            <div class="font-bold">{{ selectedEvent?.title }}</div>
        </div>
        <div class="mb-4">
            <label class="block font-semibold mb-2">
                Modifications demandées <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="changeSuggestions" rows="5"
                      placeholder="Décrivez les modifications à apporter..."
                      class="w-full"></textarea>
        </div>
        <div class="info-note info-note-orange">
            <i class="pi pi-info-circle"></i>
            <span>Le créateur recevra vos suggestions par email et verra une notification dans l'application.</span>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary"
                  (onClick)="changesDialogVisible = false" />
        <p-button label="Envoyer les suggestions" icon="pi pi-send"
                  severity="warn" [loading]="actionLoading"
                  [disabled]="!changeSuggestions.trim()"
                  (onClick)="requestChanges()" />
    </ng-template>
</p-dialog>

<!-- DIALOG : REJETER -->
<p-dialog [(visible)]="rejectDialogVisible"
          [modal]="true" [style]="{width: '520px'}"
          header="Rejeter l'événement">
    <div class="dialog-content">
        <div class="event-info-banner banner-red">
            <div class="font-bold">{{ selectedEvent?.title }}</div>
        </div>
        <div class="alert-reject mb-4">
            <i class="pi pi-exclamation-triangle"></i>
            <span>Cette action est définitive. Le créateur sera informé du rejet.</span>
        </div>
        <div class="mb-4">
            <label class="block font-semibold mb-2">
                Raison du rejet <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea [(ngModel)]="rejectReason" rows="5"
                      placeholder="Expliquez la raison du rejet..."
                      class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary"
                  (onClick)="rejectDialogVisible = false" />
        <p-button label="Confirmer le rejet" icon="pi pi-times"
                  severity="danger" [loading]="actionLoading"
                  [disabled]="!rejectReason.trim()"
                  (onClick)="rejectEvent()" />
    </ng-template>
</p-dialog>
    `,
    styleUrls: ['./validation-dashboard.css']
})
export class ValidationDashboardComponent implements OnInit {

    loading       = false;
    actionLoading = false;

    pendingEvents:  Event[] = [];
    aCorrigerEvents: Event[] = [];
    urgentEvents:   Event[] = [];

    validatedToday = 0;
    rejectedToday  = 0;

    selectedEvent: Event | null = null;

    validateDialogVisible = false;
    changesDialogVisible  = false;
    rejectDialogVisible   = false;

    validateComment   = '';
    changeSuggestions = '';
    rejectReason      = '';

    constructor(
        private eventService:   EventService,
        private authService:    AuthService,
        private router:         Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadPendingEvents();
    }

    loadPendingEvents(): void {
        this.loading = true;
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                this.pendingEvents = events
                    .filter(e => (e.status as string) === 'EN_ATTENTE_VALIDATION')
                    .sort((a, b) =>
                        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                    );

                this.aCorrigerEvents = events
                    .filter(e => (e.status as string) === 'A_CORRIGER')
                    .sort((a, b) =>
                        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                    );

                this.urgentEvents = this.pendingEvents.filter(
                    e => this.getDaysUntilStart(e) >= 0 && this.getDaysUntilStart(e) <= 7
                );

                this.validatedToday = events.filter(e => {
                    if (!e.updatedAt) return false;
                    const d = new Date(e.updatedAt); d.setHours(0, 0, 0, 0);
                    return d.getTime() === today.getTime() &&
                           (e.status as string) === 'PLANIFIE';
                }).length;

                this.rejectedToday = events.filter(e => {
                    if (!e.updatedAt) return false;
                    const d = new Date(e.updatedAt); d.setHours(0, 0, 0, 0);
                    return d.getTime() === today.getTime() &&
                           (e.status as string) === 'REJETE';
                }).length;

                this.loading = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les événements'
                });
                this.loading = false;
            }
        });
    }

    // ==========================================
    // ✅ NAVIGATION — utilise l'objet complet
    // ==========================================
    viewEvent(event: Event): void {
        if (!event?.id) {
            console.error('ID manquant:', event);
            return;
        }
        this.router.navigate(['/events', event.id]);
    }

    // ==========================================
    // DIALOGS
    // ==========================================
    openValidateDialog(event: Event): void {
        this.selectedEvent         = event;
        this.validateComment       = '';
        this.validateDialogVisible = true;
    }

    openChangesDialog(event: Event): void {
        this.selectedEvent        = event;
        this.changeSuggestions    = '';
        this.changesDialogVisible = true;
    }

    openRejectDialog(event: Event): void {
        this.selectedEvent      = event;
        this.rejectReason       = '';
        this.rejectDialogVisible = true;
    }

    // ==========================================
    // ACTIONS CGE
    // ==========================================
    validateEvent(): void {
        if (!this.selectedEvent?.id) return;
        this.actionLoading = true;

        this.eventService.validateEvent(
            this.selectedEvent.id, this.validateComment
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Valide',
                    detail: `"${this.selectedEvent?.title}" valide. Invitations envoyees.`,
                    life: 5000
                });
                this.validateDialogVisible = false;
                this.actionLoading         = false;
                this.loadPendingEvents();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de valider'
                });
                this.actionLoading = false;
            }
        });
    }

    requestChanges(): void {
        if (!this.selectedEvent?.id || !this.changeSuggestions.trim()) return;
        this.actionLoading = true;

        this.eventService.requestChanges(
            this.selectedEvent.id, this.changeSuggestions
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Modifications demandees',
                    detail: `Suggestions envoyees au createur de "${this.selectedEvent?.title}"`,
                    life: 5000
                });
                this.changesDialogVisible = false;
                this.actionLoading        = false;
                this.loadPendingEvents();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible d\'envoyer les suggestions'
                });
                this.actionLoading = false;
            }
        });
    }

    rejectEvent(): void {
        if (!this.selectedEvent?.id || !this.rejectReason.trim()) return;
        this.actionLoading = true;

        this.eventService.rejectEvent(
            this.selectedEvent.id, this.rejectReason
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Rejete',
                    detail: `"${this.selectedEvent?.title}" rejete. Createur notifie.`,
                    life: 5000
                });
                this.rejectDialogVisible = false;
                this.actionLoading       = false;
                this.loadPendingEvents();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de rejeter'
                });
                this.actionLoading = false;
            }
        });
    }

    // ==========================================
    // HELPERS
    // ==========================================
    getDaysUntilStart(event: Event): number {
        const now   = new Date(); now.setHours(0,0,0,0);
        const start = new Date(event.startDate); start.setHours(0,0,0,0);
        return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    isUrgent(event: Event): boolean {
        const days = this.getDaysUntilStart(event);
        return days >= 0 && days <= 7;
    }

    getDelaiClass(event: Event): string {
        const days = this.getDaysUntilStart(event);
        if (days < 0)   return 'delai-urgent';
        if (days <= 7)  return 'delai-urgent';
        if (days <= 14) return 'delai-warning';
        return 'delai-ok';
    }

    getLieuDisplay(event: Event): string {
        const e = event as any;
        if (e.lieuType === 'INTERNE')
            return e.salle ? `ASCELC — ${e.salle}` : 'ASCELC';
        if (e.lieuType === 'VIRTUEL') return 'En ligne';
        if (event.ville && event.pays) return `${event.ville}, ${event.pays}`;
        if (event.ville) return event.ville;
        if (event.pays)  return event.pays;
        return '—';
    }

    getRoleLabel(role: string | undefined): string {
        const labels: Record<string, string> = {
            'DIRECTEUR_CABINET': 'Dir. Cabinet',
            'PROTOCOLE':         'Protocole',
            'SECRETAIRE':        'Secretaire',
            'CGE':               'CGE',
            'ADMIN':             'Admin'
        };
        return labels[role || ''] || role || '—';
    }

    getTypeLabel(type: string):    string      { return EventTypeLabels[type] || type; }
    getTypeSeverity(type: string): TagSeverity { return getEventTypeSeverity(type); }
}