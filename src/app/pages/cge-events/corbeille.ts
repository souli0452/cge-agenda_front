import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed }                   from '@angular/core/rxjs-interop';
import { CommonModule }                          from '@angular/common';
import { Router }                                from '@angular/router';
import { FormsModule }                           from '@angular/forms';
import { interval }                              from 'rxjs';
import { switchMap }                             from 'rxjs/operators';

import { ButtonModule }        from 'primeng/button';
import { TableModule }         from 'primeng/table';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { DialogModule }        from 'primeng/dialog';
import { TooltipModule }       from 'primeng/tooltip';
import { SkeletonModule }      from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabsModule } from 'primeng/tabs';
import { BadgeModule }         from 'primeng/badge';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EventService }       from '../../service/event.service';
import { AuthService }        from '../../service/auth.service';
import { ParticipantService } from '../../service/participant.service';
import {
    Event,
    Participant,
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
        SkeletonModule, ConfirmDialogModule,
        TabsModule, BadgeModule
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
                        Éléments supprimés — restaurables ou à purger définitivement
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="last-refresh" *ngIf="lastRefresh">
                    <i class="pi pi-sync"></i> {{ lastRefresh | date:'HH:mm:ss' }}
                </span>
                <p-button label="Rafraîchir" icon="pi pi-refresh"
                          [outlined]="true" (onClick)="loadAll()"
                          [loading]="loadingEvents || loadingParticipants" />
            </div>
        </div>
    </div>

    <!-- AVERTISSEMENT -->
    <div class="alert-purge mb-4" *ngIf="canDeletePermanently && (events.length > 0 || participants.length > 0)">
        <i class="pi pi-exclamation-triangle"></i>
        <span>La suppression définitive est <strong>irréversible</strong>. Les données ne pourront pas être récupérées.</span>
    </div>

    <!-- ONGLETS -->
    <p-tabs [(value)]="activeTab">

        <p-tablist>
            <p-tab value="events">
                <span class="flex items-center gap-2">
                    <i class="pi pi-calendar"></i>
                    Événements
                    <span *ngIf="events.length > 0" class="tab-count">{{ events.length }}</span>
                </span>
            </p-tab>
            <p-tab value="participants">
                <span class="flex items-center gap-2">
                    <i class="pi pi-users"></i>
                    Participants
                    <span *ngIf="participants.length > 0" class="tab-count">{{ participants.length }}</span>
                </span>
            </p-tab>
        </p-tablist>

        <p-tabpanels>

            <!-- ── ÉVÉNEMENTS ─────────────────────────────── -->
            <p-tabpanel value="events">
                <div class="card mt-3">
                    <div *ngIf="loadingEvents">
                        <p-skeleton height="52px" styleClass="mb-2" *ngFor="let i of [1,2,3]" />
                    </div>

                    <div *ngIf="!loadingEvents && events.length === 0" class="empty-state">
                        <i class="pi pi-check-circle"></i>
                        <p>Aucun événement en corbeille.</p>
                        <p-button label="Retour aux événements" icon="pi pi-arrow-left"
                                  [outlined]="true" (onClick)="router.navigate(['/events'])" />
                    </div>

                    <p-table *ngIf="!loadingEvents && events.length > 0"
                             [value]="events" responsiveLayout="scroll"
                             styleClass="p-datatable-sm p-datatable-hoverable-rows"
                             [paginator]="events.length > 10" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width:30%">Événement</th>
                                <th>Type</th><th>Statut</th><th>Dates</th>
                                <th>Créateur</th><th>Supprimé le</th>
                                <th class="text-center">Actions</th>
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
                                <td><p-tag [value]="getTypeLabel(ev.type)" [severity]="getTypeSeverity(ev.type)" [rounded]="true" /></td>
                                <td><p-tag [value]="getStatusLabel(ev.status)" [severity]="getStatusSeverity(ev.status)" [rounded]="true" /></td>
                                <td>
                                    <div class="flex flex-col gap-1">
                                        <span class="text-sm font-medium">{{ ev.startDate | date:'dd/MM/yyyy' }}</span>
                                        <span class="text-xs text-muted-color" *ngIf="ev.endDate !== ev.startDate">→ {{ ev.endDate | date:'dd/MM/yyyy' }}</span>
                                    </div>
                                </td>
                                <td><span class="text-sm">{{ ev.creatorUsername || '—' }}</span></td>
                                <td><span class="text-sm text-muted-color">{{ ev.updatedAt | date:'dd/MM/yyyy' }}</span></td>
                                <td class="text-center">
                                    <div class="flex justify-center gap-1">
                                        <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="secondary" size="small" pTooltip="Voir" (onClick)="router.navigate(['/events', ev.id])" />
                                        <p-button icon="pi pi-undo" [rounded]="true" [text]="true" severity="success" size="small" pTooltip="Restaurer" (onClick)="restoreEvent(ev)" />
                                        <p-button *ngIf="canDeletePermanently" icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" pTooltip="Supprimer définitivement" (onClick)="confirmDeleteEvent(ev)" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </p-tabpanel>

            <!-- ── PARTICIPANTS ───────────────────────────── -->
            <p-tabpanel value="participants">
                <div class="card mt-3">
                    <div *ngIf="loadingParticipants">
                        <p-skeleton height="52px" styleClass="mb-2" *ngFor="let i of [1,2,3]" />
                    </div>

                    <div *ngIf="!loadingParticipants && participants.length === 0" class="empty-state">
                        <i class="pi pi-check-circle"></i>
                        <p>Aucun participant en corbeille.</p>
                        <p-button label="Retour aux participants" icon="pi pi-arrow-left"
                                  [outlined]="true" (onClick)="router.navigate(['/participants'])" />
                    </div>

                    <p-table *ngIf="!loadingParticipants && participants.length > 0"
                             [value]="participants" responsiveLayout="scroll"
                             styleClass="p-datatable-sm p-datatable-hoverable-rows"
                             [paginator]="participants.length > 10" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Nom</th><th>Email</th><th>Structure</th>
                                <th>Type</th><th>Supprimé le</th><th>Supprimé par</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-p>
                            <tr>
                                <td class="font-semibold">{{ p.lastName }} {{ p.firstName }}</td>
                                <td>{{ p.email }}</td>
                                <td>{{ p.structure || '—' }}</td>
                                <td>
                                    <p-tag [value]="p.participantType === 'INTERNE' ? 'Interne' : 'Externe'"
                                           [severity]="p.participantType === 'INTERNE' ? 'info' : 'warn'" [rounded]="true" />
                                </td>
                                <td><span class="text-sm text-muted-color">{{ p.deletedAt | date:'dd/MM/yyyy HH:mm' }}</span></td>
                                <td><span class="text-sm">{{ p.deletedBy || '—' }}</span></td>
                                <td class="text-center">
                                    <div class="flex justify-center gap-1">
                                        <p-button icon="pi pi-undo" [rounded]="true" [text]="true" severity="success" size="small" pTooltip="Restaurer" (onClick)="restoreParticipant(p)" />
                                        <p-button *ngIf="canDeletePermanently" icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" size="small" pTooltip="Supprimer définitivement" (onClick)="confirmDeleteParticipant(p)" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </p-tabpanel>

        </p-tabpanels>

    </p-tabs>

</div>
    `,
    styleUrls: ['./corbeille.css']
})
export class CorbeilleComponent implements OnInit {

    activeTab           = 'events';
    loadingEvents       = false;
    loadingParticipants = false;
    events:       Event[]       = [];
    participants: Participant[]  = [];
    lastRefresh: Date | null = null;

    readonly router = inject(Router);
    private readonly destroyRef         = inject(DestroyRef);
    private readonly eventService       = inject(EventService);
    private readonly participantService = inject(ParticipantService);
    private readonly authService        = inject(AuthService);
    private readonly messageService     = inject(MessageService);
    private readonly confirmService     = inject(ConfirmationService);

    private readonly POLL_MS = 30_000;

    ngOnInit(): void {
        this.loadAll();
        this.startPolling();
    }

    loadAll(): void {
        this.loadEvents();
        this.loadParticipants();
    }

    private loadEvents(): void {
        this.loadingEvents = true;
        this.eventService.getCorbeille().subscribe({
            next: d => { this.events = d; this.loadingEvents = false; this.lastRefresh = new Date(); },
            error: () => { this.loadingEvents = false; this.toast('error', 'Impossible de charger les événements'); }
        });
    }

    private loadParticipants(): void {
        this.loadingParticipants = true;
        this.participantService.getCorbeille().subscribe({
            next: d => { this.participants = d; this.loadingParticipants = false; },
            error: () => { this.loadingParticipants = false; this.toast('error', 'Impossible de charger les participants'); }
        });
    }

    private startPolling(): void {
        interval(this.POLL_MS)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                switchMap(() => this.eventService.getCorbeille())
            )
            .subscribe({ next: d => { this.events = d; this.lastRefresh = new Date(); }, error: () => {} });
    }

    get canDeletePermanently(): boolean {
        return this.authService.isAdmin || this.authService.isCGE;
    }

    restoreEvent(ev: Event): void {
        if (!ev.id) return;
        this.eventService.restoreEvent(ev.id).subscribe({
            next: () => { this.toast('success', `"${ev.title}" restauré.`); this.loadEvents(); },
            error: err => this.toast('error', err.error?.message || 'Impossible de restaurer')
        });
    }

    confirmDeleteEvent(ev: Event): void {
        this.confirmService.confirm({
            message: `Supprimer définitivement "<strong>${ev.title}</strong>" ?<br>
                      <span style="color:#c62828;font-size:13px;">Cette action est irréversible.</span>`,
            header: 'Suppression définitive',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.eventService.deleteEventPermanently(ev.id!).subscribe({
                next: () => { this.toast('success', `"${ev.title}" supprimé définitivement.`); this.loadEvents(); },
                error: err => this.toast('error', err.error?.message || 'Impossible de supprimer')
            })
        });
    }


    restoreParticipant(p: Participant): void {
        if (!p.id) return;
        this.participantService.restoreParticipant(p.id).subscribe({
            next: () => { this.toast('success', `${p.firstName} ${p.lastName} restauré(e).`); this.loadParticipants(); },
            error: err => this.toast('error', err.error?.message || 'Impossible de restaurer')
        });
    }

    confirmDeleteParticipant(p: Participant): void {
        this.confirmService.confirm({
            message: `Supprimer définitivement <strong>${p.firstName} ${p.lastName}</strong> ?<br>
                      <span style="color:#c62828;font-size:13px;">Cette action est irréversible.</span>`,
            header: 'Suppression définitive',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.participantService.deleteParticipantPermanently(p.id!).subscribe({
                next: () => { this.toast('success', `${p.firstName} ${p.lastName} supprimé(e) définitivement.`); this.loadParticipants(); },
                error: err => this.toast('error', err.error?.message || 'Impossible de supprimer')
            })
        });
    }


    getTypeLabel(type: string):     string      { return EventTypeLabels[type]    || type; }
    getStatusLabel(status: string): string      { return EventStatusLabels[status] || status; }
    getTypeSeverity(type: string):  TagSeverity { return getEventTypeSeverity(type); }
    getStatusSeverity(s: string):   TagSeverity { return getEventStatusSeverity(s); }

    private toast(severity: string, detail: string): void {
        this.messageService.add({ severity, summary: severity === 'error' ? 'Erreur' : 'Succès', detail, life: 4000 });
    }
}
