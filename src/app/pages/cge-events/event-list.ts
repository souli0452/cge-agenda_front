import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmationService, MessageService } from 'primeng/api';

// Services & Models
import { EventService } from '../../service/event.service';
import { 
    Event, 
    EventType, 
    EventStatus,
    EventTypeLabels,
    EventStatusLabels,
    getEventTypeSeverity,
    getEventStatusSeverity,
    EVENT_TYPE_OPTIONS,
    EVENT_STATUS_OPTIONS,
    TagSeverity
} from '../../models';

@Component({
    selector: 'app-event-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        Select,
        TagModule,
        TooltipModule,
        ConfirmDialogModule,
        ToastModule,
        IconFieldModule,
        InputIconModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="card">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div>
                <h5 class="m-0 mb-1">Gestion des Événements</h5>
                <p class="text-muted-color m-0 text-sm">
                    {{ filteredEvents.length }} événement(s) trouvé(s)
                </p>
            </div>
            <p-button 
                label="Nouvel événement" 
                icon="pi pi-plus" 
                (onClick)="createEvent()">
            </p-button>
        </div>

        <!-- Filters -->
        <div class="flex flex-col md:flex-row gap-4 mb-6">
            <p-iconfield iconPosition="left" class="flex-1">
                <p-inputicon styleClass="pi pi-search" />
                <input 
                    pInputText 
                    type="text" 
                    [(ngModel)]="searchKeyword"
                    (input)="applyFilters()"
                    placeholder="Rechercher par titre..."
                    class="w-full" />
            </p-iconfield>

            <p-select 
                [options]="typeOptions" 
                [(ngModel)]="selectedType"
                (onChange)="applyFilters()"
                placeholder="Tous les types"
                [showClear]="true"
                styleClass="md:w-56">
            </p-select>

            <p-select 
                [options]="statusOptions" 
                [(ngModel)]="selectedStatus"
                (onChange)="applyFilters()"
                placeholder="Tous les statuts"
                [showClear]="true"
                styleClass="md:w-56">
            </p-select>

            <p-button 
                label="Réinitialiser" 
                icon="pi pi-refresh" 
                [outlined]="true"
                (onClick)="resetFilters()">
            </p-button>
        </div>

        <!-- Table -->
        <p-table 
            #dt
            [value]="filteredEvents" 
            [loading]="loading"
            [paginator]="true" 
            [rows]="10" 
            [rowsPerPageOptions]="[5, 10, 20, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} événements"
            [globalFilterFields]="['title', 'description']"
            responsiveLayout="scroll"
            styleClass="p-datatable-gridlines"
            [tableStyle]="{ 'min-width': '50rem' }">
            
            <ng-template pTemplate="header">
                <tr>
                    <th pSortableColumn="title" style="min-width: 15rem">
                        <div class="flex items-center">
                            Titre
                            <p-sortIcon field="title" />
                        </div>
                    </th>
                    <th pSortableColumn="type" style="min-width: 10rem">
                        <div class="flex items-center">
                            Type
                            <p-sortIcon field="type" />
                        </div>
                    </th>
                    <th pSortableColumn="startDate" style="min-width: 12rem">
                        <div class="flex items-center">
                            Date
                            <p-sortIcon field="startDate" />
                        </div>
                    </th>
                    <th pSortableColumn="status" style="min-width: 10rem">
                        <div class="flex items-center">
                            Statut
                            <p-sortIcon field="status" />
                        </div>
                    </th>
                    <th style="min-width: 12rem">Lieu</th>
                    <th style="min-width: 8rem" class="text-center">Participants</th>
                    <!--  FICHIERS -->
                    <th style="min-width: 8rem" class="text-center">Fichiers</th>
                    <th style="min-width: 12rem">Actions</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-event>
                <tr>
                    <td>
                        <div class="font-semibold text-surface-900 dark:text-surface-0 mb-1">
                            {{ event.title }}
                        </div>
                        <div class="text-sm text-muted-color" *ngIf="event.description">
                            {{ event.description | slice:0:60 }}{{ event.description.length > 60 ? '...' : '' }}
                        </div>
                    </td>
                    <td>
                        <p-tag 
                            [value]="getTypeLabel(event.type)" 
                            [severity]="getTypeSeverity(event.type)"
                            [rounded]="true">
                        </p-tag>
                    </td>
                    <td>
                        <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-calendar text-sm"></i>
                                <span class="font-medium">{{ event.startDate | date:'dd/MM/yyyy' }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm text-muted-color" 
                                 *ngIf="event.endDate !== event.startDate">
                                <i class="pi pi-arrow-right"></i>
                                <span>{{ event.endDate | date:'dd/MM/yyyy' }}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <p-tag 
                            [value]="getStatusLabel(event.status)" 
                            [severity]="getStatusSeverity(event.status)"
                            [rounded]="true">
                        </p-tag>
                    </td>
                    <td>
                        <div *ngIf="event.ville || event.pays" class="flex items-center gap-2">
                            <i class="pi pi-map-marker text-muted-color"></i>
                            <span class="text-sm">
                                {{ event.ville }}{{ event.ville && event.pays ? ', ' : '' }}{{ event.pays }}
                            </span>
                        </div>
                        <div *ngIf="event.meetingLink" class="flex items-center gap-2 mt-1">
                            <i class="pi pi-video text-muted-color"></i>
                            <a [href]="event.meetingLink" target="_blank" 
                               class="text-sm text-primary hover:underline">
                                Lien visio
                            </a>
                        </div>
                        <span *ngIf="!event.ville && !event.pays && !event.meetingLink" 
                              class="text-muted-color">-</span>
                    </td>
                    <td class="text-center">
                        <div class="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-border px-3 py-1">
                            <i class="pi pi-users text-sm"></i>
                            <span class="font-semibold">{{ event.participants?.length || 0 }}</span>
                        </div>
                    </td>
                    <!-- FICHIERS -->
                    <td class="text-center">
                        <div class="inline-flex items-center gap-2 bg-green-100 dark:bg-green-400/10 text-green-700 dark:text-green-400 rounded-border px-3 py-1">
                            <i class="pi pi-paperclip text-sm"></i>
                            <span class="font-semibold">{{ event.files?.length || 0 }}</span>
                        </div>
                    </td>
                    <td>
                        <div class="flex gap-1">
                            <p-button 
                                icon="pi pi-eye" 
                                [rounded]="true" 
                                [text]="true" 
                                severity="secondary"
                                pTooltip="Voir détails"
                                tooltipPosition="top"
                                (onClick)="viewEvent(event.id)">
                            </p-button>
                            <p-button 
                                icon="pi pi-pencil" 
                                [rounded]="true" 
                                [text]="true" 
                                severity="secondary"
                                pTooltip="Modifier"
                                tooltipPosition="top"
                                (onClick)="editEvent(event.id)">
                            </p-button>
                            <p-button 
                                icon="pi pi-download" 
                                [rounded]="true" 
                                [text]="true" 
                                severity="secondary"
                                pTooltip="Liste émargement"
                                tooltipPosition="top"
                                (onClick)="downloadAttendance(event.id)">
                            </p-button>
                            <p-button 
                                icon="pi pi-trash" 
                                [rounded]="true" 
                                [text]="true" 
                                severity="danger"
                                pTooltip="Supprimer"
                                tooltipPosition="top"
                                (onClick)="confirmDelete(event)">
                            </p-button>
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="8">
                        <div class="flex flex-col items-center justify-center py-12">
                            <i class="pi pi-calendar-times text-6xl text-muted-color mb-4"></i>
                            <p class="text-surface-900 dark:text-surface-0 font-semibold text-lg m-0 mb-2">
                                Aucun événement trouvé
                            </p>
                            <p class="text-muted-color m-0 mb-4">
                                {{ searchKeyword || selectedType || selectedStatus ? 
                                   'Essayez de modifier vos filtres' : 
                                   'Commencez par créer votre premier événement' }}
                            </p>
                            <p-button 
                                *ngIf="!searchKeyword && !selectedType && !selectedStatus"
                                label="Créer un événement" 
                                icon="pi pi-plus" 
                                (onClick)="createEvent()">
                            </p-button>
                        </div>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="loadingbody">
                <tr>
                    <td colspan="8">
                        <div class="flex items-center justify-center py-12">
                            <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>
`,
styles: [`
    :host ::ng-deep {
        .p-datatable .p-datatable-tbody > tr > td {
            vertical-align: middle;
        }
        
        /* Badge participants (bleu) */
        .bg-primary\\/10 {
            background-color: rgba(66, 165, 245, 0.1);
        }
        
        /* Badge fichiers (vert) */
        .bg-green-100 {
            background-color: rgba(34, 139, 34, 0.1);
        }
        
        .dark .bg-green-400\\/10 {
            background-color: rgba(102, 187, 106, 0.1);
        }
        
        .text-green-700 {
            color: #228B22;
        }
        
        .dark .text-green-400 {
            color: #66BB6A;
        }
    }
`]
})
export class EventListComponent implements OnInit {
    loading = false;
    events: Event[] = [];
    filteredEvents: Event[] = [];

    searchKeyword = '';
    selectedType: EventType | null = null;
    selectedStatus: EventStatus | null = null;

    typeOptions = EVENT_TYPE_OPTIONS;
    statusOptions = EVENT_STATUS_OPTIONS;

    constructor(
        private eventService: EventService,
        private router: Router,
        private confirmationService: ConfirmationService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadEvents();
    }

    loadEvents(): void {
        this.loading = true;
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                this.events = events;
                this.filteredEvents = events;
                this.loading = false;
            },
            error: (err: any) => {
                console.error('Erreur:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les événements',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        this.filteredEvents = this.events.filter(event => {
            const matchesKeyword = !this.searchKeyword || 
                event.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                event.description?.toLowerCase().includes(this.searchKeyword.toLowerCase());
            
            const matchesType = !this.selectedType || event.type === this.selectedType;
            const matchesStatus = !this.selectedStatus || event.status === this.selectedStatus;

            return matchesKeyword && matchesType && matchesStatus;
        });
    }

    resetFilters(): void {
        this.searchKeyword = '';
        this.selectedType = null;
        this.selectedStatus = null;
        this.filteredEvents = this.events;
    }

    getTypeLabel(type: string): string {
        return EventTypeLabels[type] || type;
    }

    getStatusLabel(status: string): string {
        return EventStatusLabels[status] || status;
    }

    getTypeSeverity(type: string): TagSeverity {
        return getEventTypeSeverity(type);
    }

    getStatusSeverity(status: string): TagSeverity {
        return getEventStatusSeverity(status);
    }

    createEvent(): void {
        this.router.navigate(['/events/create']);
    }

    viewEvent(id: string | undefined): void {
        if (id) this.router.navigate(['/events', id]);
    }

    editEvent(id: string | undefined): void {
        if (id) this.router.navigate(['/events', id, 'edit']);
    }

    confirmDelete(event: Event): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteEvent(event.id!);
            }
        });
    }

    deleteEvent(id: string): void {
        this.eventService.deleteEvent(id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Événement supprimé avec succès',
                    life: 3000
                });
                this.loadEvents();
            },
            error: (err: any) => {
                console.error('Erreur suppression:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de supprimer l\'événement',
                    life: 3000
                });
            }
        });
    }

    downloadAttendance(id: string | undefined): void {
        if (!id) return;

        this.eventService.generateAttendanceSheet(id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `liste_emargement_${id}.xlsx`;
                a.click();
                window.URL.revokeObjectURL(url);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Liste d\'émargement téléchargée',
                    life: 3000
                });
            },
            error: (err: any) => {
                console.error('Erreur téléchargement:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de générer la liste',
                    life: 3000
                });
            }
        });
    }
}