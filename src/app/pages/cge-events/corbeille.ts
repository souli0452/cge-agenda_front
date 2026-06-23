import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { ButtonModule }        from 'primeng/button';
import { TableModule }         from 'primeng/table';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { DialogModule }        from 'primeng/dialog';
import { TooltipModule }       from 'primeng/tooltip';
import { SkeletonModule }      from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EventService } from '../../service/event.service';
import { AuthService }  from '../../service/auth.service';
import {
    Event,
    EventTypeLabels,
    EventStatusLabels,
    getEventTypeSeverity,
    getEventStatusSeverity,
    TagSeverity
} from '../../models';

@Component({
    selector: 'app-corbeille',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, TableModule, TagModule,
        ToastModule, DialogModule, TooltipModule,
        SkeletonModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="corbeille-page">

    <!-- EN-TÊTE -->
    <div class="card mb-4">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div class="flex items-center gap-3">
                <div class="corbeille-icon">
                    <i class="pi pi-trash"></i>
                </div>
                <div>
                    <h3 class="m-0 text-2xl font-bold">Corbeille</h3>
                    <p class="m-0 text-sm text-muted-color">
                        Événements supprimés — restaurables ou à purger définitivement
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="count-badge" *ngIf="events.length > 0">
                    <i class="pi pi-exclamation-circle"></i>
                    {{ events.length }} élément(s)
                </div>
                <span class="last-refresh" *ngIf="lastRefresh">
                    <i class="pi pi-sync"></i> {{ lastRefresh | date:'HH:mm:ss' }}
                </span>
                <p-button label="Rafraîchir" icon="pi pi-refresh"
                          [outlined]="true" (onClick)="load()"
                          [loading]="loading" />
            </div>
        </div>
    </div>

    <!-- AVERTISSEMENT suppression définitive -->
    <div class="alert-purge mb-4" *ngIf="canDeletePermanently && events.length > 0">
        <i class="pi pi-exclamation-triangle"></i>
        <span>La suppression définitive est <strong>irréversible</strong>.
              Les données ne pourront pas être récupérées.</span>
    </div>

    <!-- ÉTAT VIDE -->
    <div class="card" *ngIf="!loading && events.length === 0">
        <div class="empty-state">
            <i class="pi pi-check-circle"></i>
            <h4>Corbeille vide</h4>
            <p>Aucun événement en attente de suppression définitive.</p>
            <p-button label="Retour aux événements" icon="pi pi-arrow-left"
                      [outlined]="true" (onClick)="goToEvents()" />
        </div>
    </div>

    <!-- SKELETON -->
    <div *ngIf="loading" class="card">
        <p-skeleton height="60px" styleClass="mb-3" *ngFor="let i of [1,2,3]" />
    </div>

    <!-- TABLEAU -->
    <div class="card" *ngIf="!loading && events.length > 0">
        <p-table [value]="events"
                 responsiveLayout="scroll"
                 styleClass="p-datatable-sm p-datatable-hoverable-rows"
                 [tableStyle]="{'min-width': '60rem'}"
                 [paginator]="events.length > 10"
                 [rows]="10">

            <ng-template pTemplate="header">
                <tr>
                    <th style="width:28%">Événement</th>
                    <th style="width:10%">Type</th>
                    <th style="width:12%">Statut</th>
                    <th style="width:13%">Dates</th>
                    <th style="width:12%">Créateur</th>
                    <th style="width:10%">Supprimé le</th>
                    <th style="width:15%" class="text-center">Actions</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-ev>
                <tr>
                    <td>
                        <div class="flex flex-col gap-1">
                            <span class="font-semibold">{{ ev.title }}</span>
                            <span class="text-xs text-muted-color" *ngIf="ev.description">
                                {{ ev.description | slice:0:60 }}{{ ev.description?.length > 60 ? '...' : '' }}
                            </span>
                        </div>
                    </td>

                    <td>
                        <p-tag [value]="getTypeLabel(ev.type)"
                               [severity]="getTypeSeverity(ev.type)"
                               [rounded]="true" />
                    </td>

                    <td>
                        <p-tag [value]="getStatusLabel(ev.status)"
                               [severity]="getStatusSeverity(ev.status)"
                               [rounded]="true" />
                    </td>

                    <td>
                        <div class="flex flex-col gap-1">
                            <span class="text-sm font-medium">{{ ev.startDate | date:'dd/MM/yyyy' }}</span>
                            <span class="text-xs text-muted-color" *ngIf="ev.endDate !== ev.startDate">
                                → {{ ev.endDate | date:'dd/MM/yyyy' }}
                            </span>
                        </div>
                    </td>

                    <td>
                        <span class="text-sm">{{ ev.creatorUsername || '—' }}</span>
                    </td>

                    <td>
                        <span class="text-sm text-muted-color">
                            {{ ev.updatedAt | date:'dd/MM/yyyy' }}
                        </span>
                    </td>

                    <td class="text-center">
                        <div class="flex justify-center gap-1">
                            <p-button icon="pi pi-eye"
                                      [rounded]="true" [text]="true"
                                      severity="secondary" size="small"
                                      pTooltip="Voir"
                                      (onClick)="viewEvent(ev)" />
                            <p-button icon="pi pi-undo"
                                      [rounded]="true" [text]="true"
                                      severity="success" size="small"
                                      pTooltip="Restaurer"
                                      (onClick)="restore(ev)" />
                            <p-button *ngIf="canDeletePermanently"
                                      icon="pi pi-times"
                                      [rounded]="true" [text]="true"
                                      severity="danger" size="small"
                                      pTooltip="Supprimer définitivement"
                                      (onClick)="confirmPermanentDelete(ev)" />
                        </div>
                    </td>
                </tr>
            </ng-template>

        </p-table>
    </div>
</div>
    `,
    styleUrls: ['./corbeille.css']
})
export class CorbeilleComponent implements OnInit {

    loading     = false;
    events:      Event[] = [];
    lastRefresh: Date | null = null;

    private readonly destroyRef = inject(DestroyRef);
    private readonly POLL_MS    = 30_000; // 30 secondes

    constructor(
        private eventService:        EventService,
        private authService:         AuthService,
        private router:              Router,
        private messageService:      MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.load();
        this.startPolling();
    }

    private startPolling(): void {
        interval(this.POLL_MS)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap(() => this.eventService.getCorbeille())
            )
            .subscribe({
                next: (data) => {
                    this.events      = data;
                    this.lastRefresh = new Date();
                },
                error: () => {}  // silencieux — le bouton manuel reste disponible
            });
    }

    get canDeletePermanently(): boolean {
        return this.authService.isAdmin || this.authService.isCGE;
    }

    load(): void {
        this.loading = true;
        this.eventService.getCorbeille().subscribe({
            next: (data) => {
                this.events      = data;
                this.lastRefresh = new Date();
                this.loading     = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger la corbeille'
                });
                this.loading = false;
            }
        });
    }

    restore(ev: Event): void {
        if (!ev.id) return;
        this.eventService.restoreEvent(ev.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Restauré',
                    detail: `"${ev.title}" remis dans les événements actifs.`, life: 4000
                });
                this.load();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de restaurer'
                });
            }
        });
    }

    confirmPermanentDelete(ev: Event): void {
        this.confirmationService.confirm({
            message: `Supprimer définitivement "<strong>${ev.title}</strong>" ?<br>
                      <span style="color:#c62828;font-size:13px;">Cette action est irréversible.</span>`,
            header: 'Suppression définitive',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deletePermanently(ev)
        });
    }

    deletePermanently(ev: Event): void {
        if (!ev.id) return;
        this.eventService.deleteEventPermanently(ev.id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Supprimé',
                    detail: `"${ev.title}" supprimé définitivement.`, life: 4000
                });
                this.load();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de supprimer'
                });
            }
        });
    }

    viewEvent(ev: Event): void {
        if (ev.id) this.router.navigate(['/events', ev.id]);
    }

    goToEvents(): void {
        this.router.navigate(['/events']);
    }

    getTypeLabel(type: string):     string      { return EventTypeLabels[type]    || type; }
    getStatusLabel(status: string): string      { return EventStatusLabels[status] || status; }
    getTypeSeverity(type: string):  TagSeverity { return getEventTypeSeverity(type); }
    getStatusSeverity(s: string):   TagSeverity { return getEventStatusSeverity(s); }
}
