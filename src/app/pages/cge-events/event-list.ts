import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TableModule }        from 'primeng/table';
import { ButtonModule }       from 'primeng/button';
import { InputTextModule }    from 'primeng/inputtext';
import { InputText }          from 'primeng/inputtext';
import { Select }             from 'primeng/select';
import { TagModule }          from 'primeng/tag';
import { TooltipModule }      from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule }        from 'primeng/toast';
import { IconFieldModule }    from 'primeng/iconfield';
import { InputIconModule }    from 'primeng/inputicon';
import { MenuModule }         from 'primeng/menu';
import { Menu }               from 'primeng/menu';
import { Dialog }             from 'primeng/dialog';
import { Divider }            from 'primeng/divider';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';

import { EventService }       from '../../service/event.service';
import { ParticipantService } from '../../service/participant.service';
import { FileService }        from '../../service/file.service';
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
    TagSeverity,
    Participant,
    PARTICIPANT_TYPE_OPTIONS
} from '../../models';

@Component({
    selector: 'app-event-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule, InputText,
        Select, TagModule, TooltipModule, ConfirmDialogModule,
        ToastModule, IconFieldModule, InputIconModule,
        MenuModule, Dialog, Divider
    ],
    providers: [ConfirmationService, MessageService],
    template: `
<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="card">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:justify-content-between md:align-items-center mb-6 gap-4">
        <div>
            <h5 class="m-0 mb-1 text-3xl font-bold text-900">Gestion des Événements</h5>
            <p class="text-muted-color m-0 text-sm">
                {{ filteredEvents.length }} événement(s) trouvé(s)
            </p>
        </div>
        <div class="flex gap-2">
            <p-button
                icon="pi pi-file-pdf"
                label="Exporter PDF"
                severity="help"
                (onClick)="exportEventsToPdf()">
            </p-button>
            <p-button
                label="Nouvel événement"
                icon="pi pi-plus"
                (onClick)="createEvent()">
            </p-button>
        </div>
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
                    <div class="flex align-items-center">
                        Titre <p-sortIcon field="title" />
                    </div>
                </th>
                <th pSortableColumn="type" style="min-width: 10rem">
                    <div class="flex align-items-center">
                        Type <p-sortIcon field="type" />
                    </div>
                </th>
                <th pSortableColumn="startDate" style="min-width: 12rem">
                    <div class="flex align-items-center">
                        Date <p-sortIcon field="startDate" />
                    </div>
                </th>
                <th pSortableColumn="status" style="min-width: 10rem">
                    <div class="flex align-items-center">
                        Statut <p-sortIcon field="status" />
                    </div>
                </th>
                <th style="min-width: 12rem">Lieu</th>
                <th style="min-width: 8rem" class="text-center">Participants</th>
                <th style="min-width: 8rem" class="text-center">Fichiers</th>
                <th style="min-width: 12rem">Structures</th>
                <th style="min-width: 5rem" class="text-center">Actions</th>
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
                    <div class="flex flex-column gap-1">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-calendar text-sm"></i>
                            <span class="font-medium">{{ event.startDate | date:'dd/MM/yyyy' }}</span>
                        </div>
                        <div class="flex align-items-center gap-2 text-sm text-muted-color"
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
                    <div *ngIf="event.ville || event.pays" class="flex align-items-center gap-2">
                        <i class="pi pi-map-marker text-muted-color"></i>
                        <span class="text-sm">
                            {{ event.ville }}{{ event.ville && event.pays ? ', ' : '' }}{{ event.pays }}
                        </span>
                    </div>
                    <div *ngIf="event.meetingLink" class="flex align-items-center gap-2 mt-1">
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
                    <div class="inline-flex align-items-center gap-2 bg-primary/10 text-primary rounded-border px-3 py-1">
                        <i class="pi pi-users text-sm"></i>
                        <span class="font-semibold">{{ event.participants?.length || 0 }}</span>
                    </div>
                </td>
                <td class="text-center">
                    <div class="inline-flex align-items-center gap-2 bg-green-100 dark:bg-green-400/10 text-green-700 dark:text-green-400 rounded-border px-3 py-1">
                        <i class="pi pi-paperclip text-sm"></i>
                        <span class="font-semibold">{{ event.files?.length || 0 }}</span>
                    </div>
                </td>
                <td>
                    <span *ngIf="event.structures?.length; else noStructures">
                        {{ event.structures.join(', ') }}
                    </span>
                    <ng-template #noStructures><em>Aucune</em></ng-template>
                </td>
                <td class="text-center">
                    <p-button
                        icon="pi pi-ellipsis-v"
                        [rounded]="true"
                        [text]="true"
                        severity="secondary"
                        (onClick)="showEventMenu($event, event)"
                        pTooltip="Actions"
                        tooltipPosition="left">
                    </p-button>
                </td>
            </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
            <tr>
                <td colspan="9">
                    <div class="flex flex-column align-items-center justify-content-center py-12">
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
                <td colspan="9">
                    <div class="flex align-items-center justify-content-center py-12">
                        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                    </div>
                </td>
            </tr>
        </ng-template>
    </p-table>
</div>

<!-- Menu contextuel -->
<p-menu #eventMenu [model]="menuItems" [popup]="true"></p-menu>

<!-- Dialog: Gestion Participants -->
<p-dialog
    [(visible)]="manageParticipantsDialogVisible"
    [modal]="true"
    [style]="{width: '900px', maxHeight: '90vh'}"
    [draggable]="false"
    [resizable]="false"
    header="Gestion des participants">

    <div class="mb-4">
        <div class="flex gap-2 mb-3">
            <p-select
                [(ngModel)]="selectedParticipantToAdd"
                [options]="availableParticipants"
                optionLabel="displayName"
                [filter]="true"
                filterBy="displayName"
                placeholder="Sélectionner un participant existant..."
                styleClass="flex-1"
                (onChange)="onParticipantSelect()" />
            <p-button
                label="Ajouter"
                icon="pi pi-plus"
                [disabled]="!selectedParticipantToAdd"
                (onClick)="addParticipant()" />
        </div>
        <div class="text-center mb-2">
            <span class="text-500 text-sm">ou</span>
        </div>
        <p-button
            label="Créer un nouveau participant"
            icon="pi pi-user-plus"
            [outlined]="true"
            styleClass="w-full"
            (onClick)="showCreateParticipantForm = !showCreateParticipantForm" />

        <div *ngIf="showCreateParticipantForm" class="mt-3 p-4 surface-100 border-round">
            <h6 class="mb-4 font-semibold text-900 text-lg">Nouveau participant</h6>
            <div class="flex gap-3 mb-3">
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Prénom *</label>
                    <input pInputText [(ngModel)]="newParticipant.firstName" class="w-full" placeholder="Prénom" />
                </div>
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Nom *</label>
                    <input pInputText [(ngModel)]="newParticipant.lastName" class="w-full" placeholder="Nom" />
                </div>
            </div>
            <div class="flex gap-3 mb-3">
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Email *</label>
                    <input pInputText type="email" [(ngModel)]="newParticipant.email" class="w-full" placeholder="email@example.com" />
                </div>
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Téléphone</label>
                    <input pInputText [(ngModel)]="newParticipant.phoneNumber" class="w-full" placeholder="+226..." />
                </div>
            </div>
            <div class="flex gap-3 mb-3">
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Structure</label>
                    <input pInputText [(ngModel)]="newParticipant.structure" class="w-full" placeholder="Structure" />
                </div>
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Fonction</label>
                    <input pInputText [(ngModel)]="newParticipant.jobTitle" class="w-full" placeholder="Fonction" />
                </div>
            </div>
            <div class="mb-3">
                <label class="block mb-2 font-semibold text-sm">Type *</label>
                <p-select
                    [(ngModel)]="newParticipant.participantType"
                    [options]="participantTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Sélectionner un type"
                    styleClass="w-full" />
            </div>
            <p-button
                label="Créer et ajouter"
                icon="pi pi-check"
                styleClass="w-full"
                severity="success"
                (onClick)="createAndAddParticipant()" />
        </div>
    </div>

    <p-divider />

    <div>
        <h6 class="mb-3 font-semibold text-900">
            Participants de l'événement ({{ eventParticipants.length }})
        </h6>
        <p-table
            [value]="eventParticipants"
            [loading]="loadingParticipants"
            responsiveLayout="scroll"
            [paginator]="eventParticipants.length > 5"
            [rows]="5"
            styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
                <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Structure</th>
                    <th style="width: 100px" class="text-center">Action</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-participant>
                <tr>
                    <td>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-user text-500"></i>
                            <span class="font-medium">
                                {{ participant.firstName }} {{ participant.lastName }}
                            </span>
                        </div>
                    </td>
                    <td>{{ participant.email }}</td>
                    <td>{{ participant.structure || '-' }}</td>
                    <td class="text-center">
                        <p-button
                            icon="pi pi-trash"
                            [rounded]="true" [text]="true"
                            severity="danger" size="small"
                            pTooltip="Retirer"
                            (onClick)="confirmRemoveParticipant(participant)" />
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <i class="pi pi-users text-400 text-4xl mb-2"></i>
                        <p class="m-0 text-600">Aucun participant</p>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <ng-template pTemplate="footer">
        <p-button label="Fermer" icon="pi pi-times" [text]="true"
                  (onClick)="manageParticipantsDialogVisible = false" />
    </ng-template>
</p-dialog>

<!-- Dialog: Gestion Fichiers -->
<p-dialog
    [(visible)]="manageFilesDialogVisible"
    [modal]="true"
    [style]="{width: '900px', maxHeight: '90vh'}"
    [draggable]="false" [resizable]="false"
    header="Gestion des fichiers">

    <div class="mb-4">
        <div class="upload-zone" (click)="fileInput.click()">
            <input #fileInput type="file" multiple style="display: none"
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                   (change)="onFileSelected($event)" />
            <i class="pi pi-cloud-upload text-4xl text-primary mb-2"></i>
            <p class="m-0 font-semibold">Cliquez pour ajouter des fichiers</p>
            <p class="m-0 text-sm text-500">ou glissez-déposez</p>
        </div>
    </div>

    <p-divider />

    <div>
        <h6 class="mb-3 font-semibold text-900">Fichiers ({{ eventFiles.length }})</h6>
        <p-table
            [value]="eventFiles"
            [loading]="loadingFiles"
            responsiveLayout="scroll"
            [paginator]="eventFiles.length > 5"
            [rows]="5"
            styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
                <tr>
                    <th>Nom</th>
                    <th style="width: 120px">Taille</th>
                    <th style="width: 150px" class="text-center">Actions</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-file>
                <tr>
                    <td>
                        <div class="flex align-items-center gap-2">
                            <i [class]="getFileIcon(file.fileName)" style="font-size: 1.5rem"></i>
                            <span class="font-medium">{{ file.fileName }}</span>
                        </div>
                    </td>
                    <td>{{ formatFileSize(file.fileSize) }}</td>
                    <td class="text-center">
                        <p-button icon="pi pi-download" [rounded]="true" [text]="true"
                                  severity="secondary" size="small" pTooltip="Télécharger"
                                  (onClick)="downloadFile(file)" />
                        <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                                  severity="danger" size="small" pTooltip="Supprimer"
                                  (onClick)="confirmDeleteFile(file)" />
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="3" class="text-center py-4">
                        <i class="pi pi-file text-400 text-4xl mb-2"></i>
                        <p class="m-0 text-600">Aucun fichier</p>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <ng-template pTemplate="footer">
        <p-button label="Fermer" icon="pi pi-times" [text]="true"
                  (onClick)="manageFilesDialogVisible = false" />
    </ng-template>
</p-dialog>

<!-- Dialog: Annuler -->
<p-dialog
    [(visible)]="cancelDialogVisible"
    [modal]="true" [style]="{width: '550px'}"
    header="Annuler l'événement">
    <div class="p-4">
        <div class="bg-red-100 border-left-3 border-red-500 p-3 mb-3">
            <i class="pi pi-exclamation-triangle text-red-500 mr-2"></i>
            <span class="font-semibold">Action irréversible</span>
        </div>
        <label class="block mb-2 font-semibold">
            Raison <span class="text-red-500">*</span>
        </label>
        <textarea
            [(ngModel)]="cancelReason" rows="4"
            class="w-full p-3 surface-overlay border-1 surface-border border-round"
            placeholder="Expliquez la raison de l'annulation...">
        </textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Fermer" icon="pi pi-times" [text]="true"
                  (onClick)="cancelDialogVisible = false" />
        <p-button label="Confirmer l'annulation" icon="pi pi-check"
                  severity="danger"
                  [disabled]="!cancelReason.trim()"
                  (onClick)="cancelEvent()" />
    </ng-template>
</p-dialog>

<!-- Dialog: Reporter -->
<p-dialog
    [(visible)]="postponeDialogVisible"
    [modal]="true" [style]="{width: '550px'}"
    header="Reporter l'événement">
    <div class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1">
                <label class="block mb-2 font-semibold">
                    Nouvelle date début <span class="text-red-500">*</span>
                </label>
                <input type="date" [(ngModel)]="newStartDate"
                       class="w-full p-3 surface-overlay border-1 surface-border border-round" />
            </div>
            <div class="flex-1">
                <label class="block mb-2 font-semibold">
                    Nouvelle date fin <span class="text-red-500">*</span>
                </label>
                <input type="date" [(ngModel)]="newEndDate"
                       class="w-full p-3 surface-overlay border-1 surface-border border-round" />
            </div>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" icon="pi pi-times" [text]="true"
                  (onClick)="postponeDialogVisible = false" />
        <p-button label="Reporter" icon="pi pi-check" severity="warn"
                  [disabled]="!newStartDate || !newEndDate"
                  (onClick)="postponeEvent()" />
    </ng-template>
</p-dialog>
    `,
    styles: [`
        :host ::ng-deep {
            .p-datatable .p-datatable-tbody > tr > td {
                vertical-align: middle;
            }
            .p-datatable .p-datatable-thead > tr > th {
                background-color: #22c55e !important;
                color: white !important;
                font-weight: 600 !important;
                border-color: #16a34a !important;
            }
            .p-datatable .p-datatable-thead > tr > th .p-sortable-column-icon,
            .p-datatable .p-datatable-thead > tr > th .p-sorticon {
                color: white !important;
            }
            .bg-primary\\/10 { background-color: rgba(66, 165, 245, 0.1); }
            .bg-green-100    { background-color: rgba(34, 139, 34, 0.1); }
            .text-green-700  { color: #228B22; }
            .upload-zone {
                border: 2px dashed #cbd5e0;
                border-radius: 8px;
                padding: 3rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            .upload-zone:hover {
                border-color: #3b82f6;
                background: rgba(59, 130, 246, 0.05);
            }
        }
    `]
})
export class EventListComponent implements OnInit, OnDestroy {

    @ViewChild('eventMenu') eventMenu!: Menu;

    loading = false;
    events:         Event[] = [];
    filteredEvents: Event[] = [];

    searchKeyword  = '';
    selectedType:   EventType   | null = null;
    selectedStatus: EventStatus | null = null;

    typeOptions        = EVENT_TYPE_OPTIONS;
    statusOptions      = EVENT_STATUS_OPTIONS;
    participantTypeOptions = PARTICIPANT_TYPE_OPTIONS;

    // Menu & Dialogs
    menuItems:    MenuItem[] = [];
    selectedEvent: Event | null = null;

    manageParticipantsDialogVisible = false;
    manageFilesDialogVisible        = false;
    cancelDialogVisible             = false;
    postponeDialogVisible           = false;

    // Participants
    availableParticipants:   any[]        = [];
    selectedParticipantToAdd: any         = null;
    eventParticipants:        Participant[] = [];
    loadingParticipants = false;
    showCreateParticipantForm = false;
    newParticipant: any = {
        firstName: '', lastName: '', email: '',
        phoneNumber: '', structure: '', jobTitle: '',
        participantType: 'INTERNE'
    };

    // Fichiers
    eventFiles:   any[] = [];
    loadingFiles = false;

    // Annulation / Report
    cancelReason = '';
    newStartDate = '';
    newEndDate   = '';

    private statusTimer: any;

    constructor(
        private eventService:        EventService,
        private participantService:  ParticipantService,
        private fileService:         FileService,
        private router:              Router,
        private route:               ActivatedRoute,
        private confirmationService: ConfirmationService,
        private messageService:      MessageService
    ) {}

    // ==========================================
    // LIFECYCLE
    // ==========================================
    ngOnInit(): void {
        this.loadEvents();
        this.loadAvailableParticipants();

        this.route.queryParams.subscribe(params => {
            const createdId = params['created'];
            const updatedId = params['updated'];

            if (createdId) {
                setTimeout(() => {
                    const idx = this.filteredEvents.findIndex(e => e.id === createdId);
                    if (idx !== -1) {
                        const event = this.filteredEvents.splice(idx, 1)[0];
                        this.filteredEvents.unshift(event);
                        this.messageService.add({
                            severity: 'success',
                            summary: '✅ Événement créé',
                            detail: `"${event.title}" a été créé avec succès`,
                            life: 4000
                        });
                    }
                    this.router.navigate([], { queryParams: {}, replaceUrl: true });
                }, 500);

            } else if (updatedId) {
                setTimeout(() => {
                    const idx = this.filteredEvents.findIndex(e => e.id === updatedId);
                    if (idx > 0) {
                        const event = this.filteredEvents.splice(idx, 1)[0];
                        this.filteredEvents.unshift(event);
                    }
                    this.router.navigate([], { queryParams: {}, replaceUrl: true });
                }, 500);
            }
        });

        this.startStatusUpdateTimer();
    }

    ngOnDestroy(): void {
        if (this.statusTimer) {
            clearInterval(this.statusTimer);
        }
    }

   
    startStatusUpdateTimer(): void {
        this.updateEventStatuses();

        this.statusTimer = setInterval(() => {
            this.updateEventStatuses();
        }, 5 * 60 * 1000);
    }

    
    updateEventStatuses(): void {
        const now = new Date();

        this.events.forEach(event => {
            const currentStatus = event.status as string;

            if (currentStatus === 'ANNULER' || currentStatus === 'REPORTER') return;

            const startTime = event.schedules?.[0]?.startTime || '00:00:00';
            const endTime   = event.schedules?.[event.schedules.length - 1]?.endTime
                              || '23:59:59';

            const eventStart = new Date(`${event.startDate}T${startTime}`);
            const eventEnd   = new Date(`${event.endDate}T${endTime}`);

            let newStatus: string | null = null;

            if      (now >= eventEnd)                          newStatus = 'TERMINE';
            else if (now >= eventStart && now < eventEnd)      newStatus = 'EN_COURS';
            else if (now < eventStart)                         newStatus = 'PLANIFIE';

            if (!newStatus || currentStatus === newStatus) return;

            const previousStatus = currentStatus;
            event.status = newStatus as EventStatus;

            this.eventService.updateStatusOnly(event.id!, newStatus).subscribe({
                next: () => {
                    console.log(`✅ Statut auto : "${event.title}" → ${newStatus}`);
                },
                error: (err) => {
                    event.status = previousStatus as EventStatus;
                    console.error(`❌ Erreur statut auto pour "${event.title}":`, err);
                }
            });
        });

        this.applyFilters();
    }

    // ==========================================
    // CHARGEMENT
    // ==========================================
    loadEvents(): void {
        this.loading = true;
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                this.events         = events;
                this.filteredEvents = events;
                this.loading        = false;
                this.updateEventStatuses();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les événements'
                });
                this.loading = false;
            }
        });
    }

    loadAvailableParticipants(): void {
        this.participantService.getAllParticipants().subscribe({
            next: (participants) => {
                this.availableParticipants = participants.map(p => ({
                    ...p,
                    displayName: `${p.firstName} ${p.lastName} (${p.email})`
                }));
            }
        });
    }

    // ==========================================
    // MENU CONTEXTUEL
    // ==========================================
    showEventMenu(event: any, eventData: Event): void {
        this.selectedEvent = eventData;
        const status = eventData.status as string;

        const isAnnule  = status === 'ANNULER';
        const isTermine = status === 'TERMINE';
        const isBlocked = isAnnule || isTermine;

        this.menuItems = [
            {
                label: 'Voir détails',
                icon: 'pi pi-eye',
                command: () => this.viewEvent(eventData.id)
            },
            {
                label: 'Modifier',
                icon: 'pi pi-pencil',
                disabled: isBlocked,
                command: () => this.editEvent(eventData.id)
            },
            { separator: true },
            {
                label: 'Gérer participants',
                icon: 'pi pi-users',
                disabled: isBlocked,
                command: () => this.openManageParticipants()
            },
            {
                label: 'Gérer fichiers',
                icon: 'pi pi-paperclip',
                disabled: isAnnule,
                command: () => this.openManageFiles()
            },
            { separator: true },
            {
                label: 'Liste d\'émargement',
                icon: 'pi pi-download',
                command: () => this.downloadAttendance(eventData.id)
            },
            { separator: true },
            {
                label: 'Annuler l\'événement',
                icon: 'pi pi-ban',
                disabled: isBlocked,
                styleClass: 'text-red-500',
                command: () => this.showCancelDialog()
            },
            {
                label: 'Reporter l\'événement',
                icon: 'pi pi-calendar-plus',
                disabled: isBlocked,
                styleClass: 'text-orange-500',
                command: () => this.showPostponeDialog()
            },
            { separator: true },
            {
                label: 'Supprimer',
                icon: 'pi pi-trash',
                styleClass: 'text-red-500',
                command: () => this.confirmDelete(eventData)
            }
        ];

        this.eventMenu.toggle(event);
    }

    // ==========================================
    // PARTICIPANTS
    // ==========================================
    openManageParticipants(): void {
        if (!this.selectedEvent?.id) return;

        const status = this.selectedEvent.status as string;
        if (status === 'TERMINE' || status === 'ANNULER') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Action non autorisée',
                detail: 'Impossible de gérer les participants pour un événement terminé ou annulé'
            });
            return;
        }

        this.loadingParticipants      = true;
        this.showCreateParticipantForm = false;
        this.selectedParticipantToAdd  = null;
        this.resetNewParticipant();

        this.eventService.getEventParticipants(this.selectedEvent.id).subscribe({
            next: (participants) => {
                this.eventParticipants  = participants;
                this.loadingParticipants = false;
                this.updateAvailableParticipants();
                this.manageParticipantsDialogVisible = true;
            },
            error: () => {
                this.loadingParticipants = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les participants'
                });
            }
        });
    }

    updateAvailableParticipants(): void {
        this.participantService.getAllParticipants().subscribe({
            next: (all) => {
                this.availableParticipants = all
                    .filter(p => !this.eventParticipants.some(ep => ep.id === p.id))
                    .map(p => ({
                        ...p,
                        displayName: `${p.firstName} ${p.lastName} (${p.email})`
                    }));
            }
        });
    }

    onParticipantSelect(): void {
        if (this.selectedParticipantToAdd) {
            this.showCreateParticipantForm = false;
        }
    }

    resetNewParticipant(): void {
        this.newParticipant = {
            firstName: '', lastName: '', email: '',
            phoneNumber: '', structure: '', jobTitle: '',
            participantType: 'INTERNE'
        };
    }

    createAndAddParticipant(): void {
        if (!this.newParticipant.firstName ||
            !this.newParticipant.lastName  ||
            !this.newParticipant.email) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Champs manquants',
                detail: 'Prénom, Nom et Email sont obligatoires'
            });
            return;
        }
        if (!this.selectedEvent?.id) return;

        this.loadingParticipants = true;
        this.participantService.createParticipant(this.newParticipant).subscribe({
            next: (created) => {
                this.eventService.addParticipant(this.selectedEvent!.id!, created).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Participant créé et ajouté avec succès'
                        });
                        this.resetNewParticipant();
                        this.showCreateParticipantForm = false;
                        this.refreshParticipants();
                    },
                    error: (err) => {
                        this.loadingParticipants = false;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: err.error?.message || 'Erreur lors de l\'ajout à l\'événement'
                        });
                    }
                });
            },
            error: (err) => {
                this.loadingParticipants = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de créer le participant'
                });
            }
        });
    }

    addParticipant(): void {
        if (!this.selectedParticipantToAdd || !this.selectedEvent?.id) return;
        this.loadingParticipants = true;

        this.eventService.addParticipant(
            this.selectedEvent.id, this.selectedParticipantToAdd
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Participant ajouté avec succès'
                });
                this.selectedParticipantToAdd = null;
                this.refreshParticipants();
            },
            error: (err) => {
                this.loadingParticipants = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Impossible d\'ajouter le participant'
                });
            }
        });
    }

    private refreshParticipants(): void {
        if (!this.selectedEvent?.id) return;
        this.eventService.getEventParticipants(this.selectedEvent.id).subscribe({
            next: (participants) => {
                this.eventParticipants   = participants;
                this.loadingParticipants = false;
                this.updateAvailableParticipants();
                this.loadEvents();
            },
            error: () => { this.loadingParticipants = false; }
        });
    }

    confirmRemoveParticipant(participant: Participant): void {
        this.confirmationService.confirm({
            message: `Retirer ${participant.firstName} ${participant.lastName} ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            accept: () => this.removeParticipant(participant.id!)
        });
    }

    removeParticipant(participantId: string): void {
        if (!this.selectedEvent?.id) return;
        this.loadingParticipants = true;

        this.eventService.removeParticipant(
            this.selectedEvent.id, participantId
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Participant retiré avec succès'
                });
                this.refreshParticipants();
            },
            error: (err) => {
                this.loadingParticipants = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de retirer le participant'
                });
            }
        });
    }

    // ==========================================
    // FICHIERS
    // ==========================================
    openManageFiles(): void {
        if (!this.selectedEvent?.id) return;

        const status = this.selectedEvent.status as string;
        if (status === 'ANNULER') {
            this.messageService.add({
                severity: 'warn',
                summary: 'Action non autorisée',
                detail: 'Impossible de gérer les fichiers d\'un événement annulé'
            });
            return;
        }

        this.loadingFiles = true;
        this.fileService.getFilesByEvent(this.selectedEvent.id).subscribe({
            next: (files) => {
                this.eventFiles   = files;
                this.loadingFiles = false;
                this.manageFilesDialogVisible = true;
            },
            error: () => {
                this.loadingFiles = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les fichiers'
                });
            }
        });
    }

    onFileSelected(event: any): void {
        if (!this.selectedEvent?.id) return;
        const files      = event.target.files;
        let uploaded     = 0;
        let errors       = 0;
        const total      = files.length;

        for (const file of files) {
            if (this.eventFiles.some(f =>
                    f.fileName.toLowerCase() === file.name.toLowerCase())) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Fichier existant',
                    detail: `"${file.name}" existe déjà`
                });
                errors++;
                if (uploaded + errors === total) this.refreshFiles();
                continue;
            }

            const formData = new FormData();
            formData.append('file',    file);
            formData.append('eventId', this.selectedEvent.id);
            this.loadingFiles = true;

            this.fileService.uploadFile(formData).subscribe({
                next: () => {
                    uploaded++;
                    if (uploaded + errors === total) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `${uploaded} fichier(s) ajouté(s)`
                        });
                        this.refreshFiles();
                    }
                },
                error: (err) => {
                    errors++;
                    this.loadingFiles = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: err.error?.message || `Impossible d'ajouter "${file.name}"`
                    });
                }
            });
        }
        event.target.value = '';
    }

    private refreshFiles(): void {
        if (!this.selectedEvent?.id) return;
        this.fileService.getFilesByEvent(this.selectedEvent.id).subscribe({
            next: (files) => {
                this.eventFiles   = files;
                this.loadingFiles = false;
                this.loadEvents();
            },
            error: () => { this.loadingFiles = false; }
        });
    }

    downloadFile(file: any): void {
        if (!file.id) return;
        this.fileService.downloadFile(file.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = file.fileName;
                a.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success', summary: 'Succès', detail: 'Fichier téléchargé'
                });
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur', detail: 'Impossible de télécharger'
            })
        });
    }

    confirmDeleteFile(file: any): void {
        this.confirmationService.confirm({
            message: `Supprimer "${file.fileName}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui', rejectLabel: 'Non',
            accept: () => this.deleteFile(file.id)
        });
    }

    deleteFile(fileId: string): void {
        this.loadingFiles = true;
        this.fileService.deleteFile(fileId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Succès', detail: 'Fichier supprimé'
                });
                this.refreshFiles();
            },
            error: (err) => {
                this.loadingFiles = false;
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de supprimer'
                });
            }
        });
    }

    // ==========================================
    // ANNULER / REPORTER
    // ==========================================
    showCancelDialog(): void {
        this.cancelReason      = '';
        this.cancelDialogVisible = true;
    }

    cancelEvent(): void {
        if (!this.selectedEvent?.id || !this.cancelReason?.trim()) return;
        this.eventService.cancelEvent(
            this.selectedEvent.id, this.cancelReason
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Succès', detail: 'Événement annulé'
                });
                this.cancelDialogVisible = false;
                this.loadEvents();
            },
            error: (err) => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: err.error?.message || 'Impossible d\'annuler'
            })
        });
    }

    showPostponeDialog(): void {
        if (this.selectedEvent) {
            this.newStartDate = this.selectedEvent.startDate;
            this.newEndDate   = this.selectedEvent.endDate;
        }
        this.postponeDialogVisible = true;
    }

    postponeEvent(): void {
        if (!this.selectedEvent?.id || !this.newStartDate || !this.newEndDate) return;

        this.eventService.postponeEvent(
            this.selectedEvent.id, this.newStartDate, this.newEndDate
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Succès',
                    detail: 'Événement reporté avec succès'
                });
                this.postponeDialogVisible = false;
                this.loadEvents();
            },
            error: (err) => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: err.error?.message || 'Impossible de reporter'
            })
        });
    }

    // ==========================================
    // FILTRES
    // ==========================================
    applyFilters(): void {
        this.filteredEvents = this.events.filter(event => {
            const kw = this.searchKeyword?.toLowerCase();
            const matchesKeyword = !kw ||
                event.title.toLowerCase().includes(kw) ||
                event.description?.toLowerCase().includes(kw);
            const matchesType   = !this.selectedType   || event.type   === this.selectedType;
            const matchesStatus = !this.selectedStatus || event.status === this.selectedStatus;
            return matchesKeyword && matchesType && matchesStatus;
        });
    }

    resetFilters(): void {
        this.searchKeyword  = '';
        this.selectedType   = null;
        this.selectedStatus = null;
        this.filteredEvents = this.events;
    }

    // ==========================================
    // HELPERS
    // ==========================================
    getTypeLabel(type: string):   string     { return EventTypeLabels[type]   || type; }
    getStatusLabel(status: string): string   { return EventStatusLabels[status] || status; }
    getTypeSeverity(type: string): TagSeverity   { return getEventTypeSeverity(type); }
    getStatusSeverity(status: string): TagSeverity { return getEventStatusSeverity(status); }

    getFileIcon(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const icons: Record<string, string> = {
            'pdf':  'pi pi-file-pdf text-red-500',
            'doc':  'pi pi-file-word text-blue-500',
            'docx': 'pi pi-file-word text-blue-500',
            'xls':  'pi pi-file-excel text-green-500',
            'xlsx': 'pi pi-file-excel text-green-500',
            'ppt':  'pi pi-file text-orange-500',
            'pptx': 'pi pi-file text-orange-500',
            'jpg':  'pi pi-image text-purple-500',
            'jpeg': 'pi pi-image text-purple-500',
            'png':  'pi pi-image text-purple-500'
        };
        return icons[ext || ''] || 'pi pi-file text-gray-500';
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k     = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i     = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    createEvent():  void { this.router.navigate(['/events/create']); }
    viewEvent(id: string | undefined):  void { if (id) this.router.navigate(['/events', id]); }
    editEvent(id: string | undefined):  void { if (id) this.router.navigate(['/events', id, 'edit']); }

    confirmDelete(event: Event): void {
        this.confirmationService.confirm({
            message: `Supprimer définitivement "${event.title}" ?`,
            header: 'Confirmation de suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteEvent(event.id!)
        });
    }

    deleteEvent(id: string): void {
        this.eventService.deleteEvent(id).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Succès', detail: 'Événement supprimé'
                });
                this.loadEvents();
            },
            error: (err) => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: err.error?.message || 'Impossible de supprimer'
            })
        });
    }

    // ==========================================
    // EXPORT PDF
    // ==========================================
    exportEventsToPdf(): void {
        const today = new Date();
        this.eventService.exportMonthlyPdf(
            today.getFullYear(),
            today.getMonth() + 1,
            this.searchKeyword   || undefined,
            this.selectedType    || undefined,
            this.selectedStatus  || undefined
        ).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = `evenements_${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2,'0')}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success', summary: 'Succès', detail: 'Export PDF généré'
                });
            },
            error: (err) => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: 'Impossible d\'exporter la liste'
            })
        });
    }

    downloadAttendance(id: string | undefined): void {
        if (!id) return;
        this.eventService.generateAttendanceSheet(id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = `liste_emargement_${id}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({
                    severity: 'success', summary: 'Succès', detail: 'Liste téléchargée'
                });
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur', detail: 'Impossible de télécharger'
            })
        });
    }
}