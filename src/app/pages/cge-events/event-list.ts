import { Component, OnInit, OnDestroy, ViewChild, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TableModule }         from 'primeng/table';
import { ButtonModule }        from 'primeng/button';
import { InputTextModule }     from 'primeng/inputtext';
import { InputText }           from 'primeng/inputtext';
import { Select }              from 'primeng/select';
import { TagModule }           from 'primeng/tag';
import { TooltipModule }       from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule }         from 'primeng/toast';
import { IconFieldModule }     from 'primeng/iconfield';
import { InputIconModule }     from 'primeng/inputicon';
import { MenuModule }          from 'primeng/menu';
import { Menu }                from 'primeng/menu';
import { Dialog }              from 'primeng/dialog';
import { Divider }             from 'primeng/divider';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';

import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';

import { EventService }       from '../../service/event.service';
import { ParticipantService } from '../../service/participant.service';
import { FileService }        from '../../service/file.service';
import { ExportService }      from '../../service/export.service';
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
import { EventFiltersComponent, EventFilters } from './components/event-filters/event-filters';
import { ViewModeToggleComponent } from '../../shared/view-mode-toggle/view-mode-toggle';
import { EventRowActionsComponent } from './components/event-row-actions/event-row-actions';
import { environments } from '../../../environments/environments';
import { AgendaYearService } from '../../service/agenda-year.service';

@Component({
    selector: 'app-event-list',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        TableModule, ButtonModule, InputTextModule, InputText,
        Select, TagModule, TooltipModule, ConfirmDialogModule,
        ToastModule, IconFieldModule, InputIconModule,
        MenuModule, Dialog, Divider,
        EventFiltersComponent, EventRowActionsComponent, ViewModeToggleComponent
    ],
    providers: [ConfirmationService, MessageService],
    template: `
<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="el-page">

    <!-- ================================================
         EN-TÊTE
         ================================================ -->
    <div class="el-header">
        <div class="el-header-left">
            <div class="el-header-icon">
                <i class="pi pi-calendar-plus"></i>
            </div>
            <div>
                <h1 class="el-title">Gestion des événements</h1>
                <p class="el-subtitle">Suivi et administration des événements institutionnels</p>
            </div>
        </div>

        <div class="el-stats">
            <div class="el-stat">
                <i class="pi pi-list"></i>
                <span class="el-stat-num">{{ filteredEvents.length }}</span>
                <span class="el-stat-lbl">Total</span>
            </div>
            <div class="el-stat el-stat-blue">
                <i class="pi pi-calendar"></i>
                <span class="el-stat-num">{{ eventsThisMonth }}</span>
                <span class="el-stat-lbl">Ce mois</span>
            </div>
            <div class="el-stat el-stat-warn" *ngIf="eventsPending > 0">
                <i class="pi pi-clock"></i>
                <span class="el-stat-num">{{ eventsPending }}</span>
                <span class="el-stat-lbl">En attente</span>
            </div>
            <div class="el-stat el-stat-success" *ngIf="eventsInProgress > 0">
                <i class="pi pi-play"></i>
                <span class="el-stat-num">{{ eventsInProgress }}</span>
                <span class="el-stat-lbl">En cours</span>
            </div>
        </div>

        <!-- Toggle vue liste / cartes -->
        <app-view-mode-toggle [(viewMode)]="viewMode"></app-view-mode-toggle>

        <div class="el-header-actions">
            <div class="export-btn-group">
                <p-button
                    icon="pi pi-file-pdf"
                    label="PDF"
                    [outlined]="true"
                    severity="secondary"
                    pTooltip="Exporter en PDF"
                    (onClick)="exportToPDF()">
                </p-button>
                <p-button
                    icon="pi pi-file-excel"
                    label="Excel"
                    [outlined]="true"
                    severity="secondary"
                    pTooltip="Exporter en Excel"
                    (onClick)="exportToExcel()">
                </p-button>
                <p-button
                    icon="pi pi-download"
                    label="Fichiers (.zip)"
                    [outlined]="true"
                    severity="secondary"
                    pTooltip="Télécharger toutes les pièces jointes"
                    [loading]="zippingFiles"
                    (onClick)="exportFilesAsZip()">
                </p-button>
                <p-button
                    icon="pi pi-print"
                    label="Rapport"
                    [outlined]="true"
                    severity="secondary"
                    pTooltip="Ouvrir le rapport imprimable"
                    (onClick)="openReport()">
                </p-button>
            </div>
            <p-button
                label="Nouvel événement"
                icon="pi pi-plus"
                severity="success"
                (onClick)="createEvent()">
            </p-button>
        </div>
    </div>

    <!-- ================================================
         FILTRES
         ================================================ -->
    <app-event-filters (filtersChange)="onFiltersChange($event)"></app-event-filters>

    <!-- ================================================
         VUE CARTE MOBILE
         ================================================ -->
    <div class="el-cards-section" [class.el-cards-desktop]="viewMode === 'card'">
        <div *ngFor="let event of mobileEvents" class="el-event-card"
             [style]="{'border-left-color': getEventTypeColor(event.type)}"
             (click)="viewEvent(event.id)">

            <!-- En-tête carte -->
            <div class="elc-header">
                <div class="elc-type-dot" [style.background]="getEventTypeColor(event.type)"></div>
                <div class="elc-title-block">
                    <div class="elc-title">{{ event.title }}</div>
                    <span class="el-type-pill"
                          [style.background]="getEventTypeColor(event.type) + '18'"
                          [style.color]="getEventTypeColor(event.type)"
                          [style.border]="'1px solid ' + getEventTypeColor(event.type) + '40'">
                        {{ getTypeLabel(event.type) }}
                    </span>
                </div>
                <p-tag [value]="getStatusLabel(event.status)"
                       [severity]="getStatusSeverity(event.status)"
                       [rounded]="true" class="elc-status">
                </p-tag>
            </div>

            <!-- Infos -->
            <div class="elc-body">
                <div class="elc-row">
                    <i class="pi pi-calendar elc-icon"></i>
                    <span>{{ event.startDate | date:'dd MMM yyyy' }}
                        <span *ngIf="event.endDate !== event.startDate"> → {{ event.endDate | date:'dd MMM yyyy' }}</span>
                    </span>
                </div>
                <div class="elc-row" *ngIf="getEventLieu(event)">
                    <i [class]="getLieuIcon(event)" class="elc-icon"></i>
                    <span>{{ getEventLieu(event) }}</span>
                </div>
                <div class="elc-row">
                    <i class="pi pi-users elc-icon"></i>
                    <span>{{ event.participants?.length || 0 }} participant(s)</span>
                    <span class="elc-sep">·</span>
                    <i class="pi pi-paperclip elc-icon"></i>
                    <span>{{ event.files?.length || 0 }} fichier(s)</span>
                </div>
            </div>

            <!-- Badges alerte -->
            <div class="elc-alerts" *ngIf="event.status === 'REJETE' || hasAmendments(event)">
                <div *ngIf="event.status === 'REJETE'" class="rejection-badge">
                    <i class="pi pi-times-circle"></i> Rejeté par CGE
                </div>
                <div *ngIf="hasAmendments(event)" class="amendment-badge">
                    <i class="pi pi-wrench"></i> Modif. demandées
                </div>
            </div>

            <!-- Actions -->
            <div class="elc-footer" (click)="$event.stopPropagation()">
                <app-event-row-actions
                    [event]="event"
                    [canEdit]="canEditEvent(event)"
                    [canDelete]="canDeleteEvent(event)"
                    [canCancel]="canCancelEvent(event)"
                    [canPostpone]="canCancelEvent(event)"
                    (view)="viewEventObj($event)"
                    (edit)="editEventObj($event)"
                    (cancel)="openCancelDialog($event)"
                    (postpone)="openPostponeDialog($event)"
                    (delete)="confirmDelete($event)">
                </app-event-row-actions>
            </div>
        </div>

        <div *ngIf="filteredEvents.length === 0" class="el-empty">
            <div class="el-empty-icon-wrap"><i class="pi pi-calendar-times"></i></div>
            <p class="el-empty-title">Aucun événement trouvé</p>
        </div>

        <!-- Pagination mobile événements -->
        <div class="el-mobile-pag" *ngIf="filteredEvents.length > 0">
            <button class="mob-pag-btn" [disabled]="mobilePage === 0" (click)="mobilePage = mobilePage - 1">
                <i class="pi pi-chevron-left"></i>
            </button>
            <span class="mob-pag-info">
                Page {{ mobilePage + 1 }} / {{ mobileTotalPages }}
                &nbsp;·&nbsp; {{ filteredEvents.length }} événement(s)
            </span>
            <button class="mob-pag-btn" [disabled]="mobilePage >= mobileTotalPages - 1" (click)="mobilePage = mobilePage + 1">
                <i class="pi pi-chevron-right"></i>
            </button>
        </div>
    </div>

    <!-- ================================================
         TABLEAU (desktop uniquement)
         ================================================ -->
    <div class="el-card el-desktop-table" [class.el-table-hidden]="viewMode === 'card'">
        <p-table
            #dt
            [value]="filteredEvents"
            [loading]="loading"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[5,10,20,50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} événement(s)"
            responsiveLayout="scroll"
            styleClass="el-table"
            [tableStyle]="{'min-width':'60rem'}">

            <ng-template pTemplate="header">
                <tr>
                    <th class="el-th-bar"></th>
                    <th pSortableColumn="title" style="min-width:16rem">
                        Titre <p-sortIcon field="title"/>
                    </th>
                    <th pSortableColumn="type" style="min-width:10rem">
                        Type <p-sortIcon field="type"/>
                    </th>
                    <th pSortableColumn="startDate" style="min-width:13rem">
                        Dates <p-sortIcon field="startDate"/>
                    </th>
                    <th pSortableColumn="status" style="min-width:11rem">
                        Statut <p-sortIcon field="status"/>
                    </th>
                    <th style="min-width:12rem">Lieu</th>
                    <th style="min-width:7rem" class="text-center">Participants</th>
                    <th style="min-width:7rem" class="text-center">Fichiers</th>
                    <th style="min-width:5rem" class="text-center">Actions</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-event>
                <tr class="el-row"
                    [class.el-row-rejected]="event.status === 'REJETE'"
                    [style]="{'--row-color': getEventTypeColor(event.type)}"
                    tabindex="0"
                    role="button"
                    [attr.aria-label]="'Voir les détails de ' + event.title"
                    (click)="viewEvent(event.id)"
                    (keydown.enter)="viewEvent(event.id)"
                    (keydown.space)="$event.preventDefault(); viewEvent(event.id)">

                    <!-- Barre de couleur latérale -->
                    <td class="el-td-bar"></td>

                    <!-- Titre -->
                    <td>
                        <div class="el-event-title">{{ event.title }}</div>
                        <div *ngIf="event.status === 'REJETE'" class="rejection-badge">
                            <i class="pi pi-times-circle"></i>
                            <span *ngIf="event.rejectionReason">
                                Rejeté — {{ event.rejectionReason | slice:0:40 }}{{ event.rejectionReason!.length > 40 ? '…' : '' }}
                            </span>
                            <span *ngIf="!event.rejectionReason">Rejeté par CGE</span>
                        </div>
                        <div *ngIf="hasAmendments(event)" class="amendment-badge">
                            <i class="pi pi-wrench"></i>
                            <span class="hidden-mobile">Modifications demandées par CGE</span>
                            <span class="visible-mobile">Modif. CGE</span>
                        </div>
                        <div class="el-event-desc" *ngIf="event.description">
                            {{ event.description | slice:0:65 }}{{ event.description?.length > 65 ? '…' : '' }}
                        </div>
                    </td>

                    <!-- Type -->
                    <td>
                        <span class="el-type-pill"
                              [style.background]="getEventTypeColor(event.type) + '18'"
                              [style.color]="getEventTypeColor(event.type)"
                              [style.border]="'1px solid ' + getEventTypeColor(event.type) + '40'">
                            {{ getTypeLabel(event.type) }}
                        </span>
                    </td>

                    <!-- Dates -->
                    <td>
                        <div class="el-date-wrap">
                            <div class="el-date-icon-wrap">
                                <i class="pi pi-calendar"></i>
                            </div>
                            <div>
                                <div class="el-date-main">{{ event.startDate | date:'dd MMM yyyy' }}</div>
                                <div class="el-date-end" *ngIf="event.endDate !== event.startDate">
                                    <i class="pi pi-arrow-right" style="font-size:9px"></i>
                                    {{ event.endDate | date:'dd MMM yyyy' }}
                                </div>
                            </div>
                        </div>
                    </td>

                    <!-- Statut -->
                    <td>
                        <p-tag [value]="getStatusLabel(event.status)"
                               [severity]="getStatusSeverity(event.status)"
                               [rounded]="true">
                        </p-tag>
                    </td>

                    <!-- Lieu -->
                    <td>
                        <div *ngIf="getEventLieu(event)" class="el-lieu">
                            <i [class]="getLieuIcon(event)" class="el-lieu-icon"></i>
                            <span>{{ getEventLieu(event) }}</span>
                        </div>
                        <div *ngIf="event.meetingLink && event.lieuType === 'VIRTUEL'" class="mt-1">
                            <a [href]="event.meetingLink" target="_blank"
                               class="el-visio-link"
                               (click)="$event.stopPropagation()">
                                <i class="pi pi-video"></i> Rejoindre
                            </a>
                        </div>
                        <span *ngIf="!getEventLieu(event)" class="text-muted-color">—</span>
                    </td>

                    <!-- Participants -->
                    <td class="text-center">
                        <span class="el-counter el-counter-blue">
                            <i class="pi pi-users"></i>
                            {{ event.participants?.length || 0 }}
                        </span>
                    </td>

                    <!-- Fichiers -->
                    <td class="text-center">
                        <span class="el-counter el-counter-green">
                            <i class="pi pi-paperclip"></i>
                            {{ event.files?.length || 0 }}
                        </span>
                    </td>

                    <!-- Actions -->
                    <td class="text-center" (click)="$event.stopPropagation()">
                        <app-event-row-actions
                            [event]="event"
                            [canEdit]="canEditEvent(event)"
                            [canDelete]="canDeleteEvent(event)"
                            [canCancel]="canCancelEvent(event)"
                            [canPostpone]="canCancelEvent(event)"
                            (view)="viewEventObj($event)"
                            (edit)="editEventObj($event)"
                            (cancel)="openCancelDialog($event)"
                            (postpone)="openPostponeDialog($event)"
                            (delete)="confirmDelete($event)">
                        </app-event-row-actions>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="9">
                        <div class="el-empty">
                            <div class="el-empty-icon-wrap">
                                <i class="pi pi-calendar-times"></i>
                            </div>
                            <p class="el-empty-title">Aucun événement trouvé</p>
                            <p class="el-empty-sub" *ngIf="searchKeyword || selectedType || selectedStatus">
                                Modifiez vos critères de recherche ou réinitialisez les filtres
                            </p>
                            <p-button
                                *ngIf="!searchKeyword && !selectedType && !selectedStatus"
                                label="Créer le premier événement"
                                icon="pi pi-plus"
                                severity="success"
                                (onClick)="createEvent()">
                            </p-button>
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>

</div>

<p-menu #eventMenu [model]="menuItems" [popup]="true"></p-menu>

<!-- ================================================
     DIALOG : PARTICIPANTS
     ================================================ -->
<p-dialog [(visible)]="manageParticipantsDialogVisible"
          [modal]="true"
          [style]="{width:'900px'}"
          [draggable]="false"
          header="Gestion des participants">

    <div class="mb-4">
        <div class="flex gap-2 mb-3">
            <p-select
                [(ngModel)]="selectedParticipantToAdd"
                [options]="availableParticipants"
                optionLabel="displayName"
                [filter]="true"
                filterBy="displayName"
                placeholder="Sélectionner un participant..."
                styleClass="flex-1" />
            <p-button
                label="Ajouter"
                icon="pi pi-plus"
                [disabled]="!selectedParticipantToAdd"
                (onClick)="addParticipant()" />
        </div>
        <p-button
            label="Créer un nouveau participant"
            icon="pi pi-user-plus"
            [outlined]="true"
            styleClass="w-full"
            (onClick)="showCreateParticipantForm = !showCreateParticipantForm" />
        <div *ngIf="showCreateParticipantForm" class="mt-3 p-4 surface-100 border-round">
            <div class="flex gap-3 mb-3">
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Prénom *</label>
                    <input pInputText [(ngModel)]="newParticipant.firstName" class="w-full" />
                </div>
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Nom *</label>
                    <input pInputText [(ngModel)]="newParticipant.lastName" class="w-full" />
                </div>
            </div>
            <div class="flex gap-3 mb-3">
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Email *</label>
                    <input pInputText type="email" [(ngModel)]="newParticipant.email" class="w-full" />
                </div>
                <div class="flex-1">
                    <label class="block mb-2 font-semibold text-sm">Structure</label>
                    <input pInputText [(ngModel)]="newParticipant.structure" class="w-full" />
                </div>
            </div>
            <p-button label="Créer et ajouter" icon="pi pi-check" styleClass="w-full"
                      severity="success" (onClick)="createAndAddParticipant()" />
        </div>
    </div>
    <p-divider />
    <p-table [value]="eventParticipants" [loading]="loadingParticipants" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
            <tr>
                <th>Nom</th><th>Email</th><th>Structure</th>
                <th class="text-center">Action</th>
            </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
            <tr>
                <td>{{ p.firstName }} {{ p.lastName }}</td>
                <td>{{ p.email }}</td>
                <td>{{ p.structure || '-' }}</td>
                <td class="text-center">
                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                              severity="danger" size="small"
                              ariaLabel="Retirer le participant"
                              (onClick)="confirmRemoveParticipant(p)" />
                </td>
            </tr>
        </ng-template>
    </p-table>
    <ng-template pTemplate="footer">
        <p-button label="Fermer" [text]="true" (onClick)="manageParticipantsDialogVisible = false" />
    </ng-template>
</p-dialog>

<!-- ================================================
     DIALOG : FICHIERS
     ================================================ -->
<p-dialog [(visible)]="manageFilesDialogVisible"
          [modal]="true"
          [style]="{width:'900px'}"
          [draggable]="false"
          header="Gestion des fichiers">

    <div class="mb-4">
        <div class="upload-zone" (click)="fileInput.click()">
            <input #fileInput type="file" multiple style="display:none"
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                   (change)="onFileSelected($event)" />
            <i class="pi pi-cloud-upload text-4xl text-primary mb-2"></i>
            <p class="m-0 font-semibold">Cliquez pour ajouter des fichiers</p>
        </div>
    </div>
    <p-divider />
    <p-table [value]="eventFiles" [loading]="loadingFiles" styleClass="p-datatable-sm">
        <ng-template pTemplate="header">
            <tr>
                <th>Nom</th>
                <th style="width:120px">Taille</th>
                <th style="width:150px" class="text-center">Actions</th>
            </tr>
        </ng-template>
        <ng-template pTemplate="body" let-file>
            <tr>
                <td>
                    <div class="flex align-items-center gap-2">
                        <i [class]="getFileIcon(file.fileName)" style="font-size:1.5rem"></i>
                        <span>{{ file.fileName }}</span>
                    </div>
                </td>
                <td>{{ formatFileSize(file.fileSize) }}</td>
                <td class="text-center">
                    <p-button icon="pi pi-download" [rounded]="true" [text]="true"
                              severity="secondary" size="small"
                              ariaLabel="Télécharger le fichier"
                              (onClick)="downloadFile(file)" />
                    <p-button icon="pi pi-trash" [rounded]="true" [text]="true"
                              severity="danger" size="small"
                              ariaLabel="Supprimer le fichier"
                              (onClick)="confirmDeleteFile(file)" />
                </td>
            </tr>
        </ng-template>
    </p-table>
    <ng-template pTemplate="footer">
        <p-button label="Fermer" [text]="true" (onClick)="manageFilesDialogVisible = false" />
    </ng-template>
</p-dialog>

<!-- ================================================
     DIALOG : ANNULER
     ================================================ -->
<p-dialog [(visible)]="cancelDialogVisible"
          [modal]="true"
          [style]="{width:'520px'}"
          header="Annuler l'événement">
    <div class="p-4">
        <label class="block mb-2 font-semibold">
            Raison de l'annulation <span class="text-red-500">*</span>
        </label>
        <textarea [(ngModel)]="cancelReason" rows="4"
                  class="w-full p-3 surface-overlay border-1 surface-border border-round"
                  placeholder="Expliquez la raison..."></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Fermer"    [text]="true"    (onClick)="cancelDialogVisible = false" />
        <p-button label="Confirmer" icon="pi pi-check" severity="danger"
                  [disabled]="!cancelReason.trim()" (onClick)="cancelEvent()" />
    </ng-template>
</p-dialog>

<!-- ================================================
     DIALOG : REPORTER
     ================================================ -->
<p-dialog [(visible)]="postponeDialogVisible"
          [modal]="true"
          [style]="{width:'520px'}"
          header="Reporter l'événement">
    <div class="p-4 flex gap-4">
        <div class="flex-1">
            <label class="block mb-2 font-semibold">Nouvelle date début *</label>
            <input type="date" [(ngModel)]="newStartDate"
                   class="w-full p-3 surface-overlay border-1 surface-border border-round" />
        </div>
        <div class="flex-1">
            <label class="block mb-2 font-semibold">Nouvelle date fin *</label>
            <input type="date" [(ngModel)]="newEndDate"
                   class="w-full p-3 surface-overlay border-1 surface-border border-round" />
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true"  (onClick)="postponeDialogVisible = false" />
        <p-button label="Reporter" icon="pi pi-check" severity="warn"
                  [disabled]="!newStartDate || !newEndDate" (onClick)="postponeEvent()" />
    </ng-template>
</p-dialog>
    `,
    styleUrls: ['./event-list.css']
})
export class EventListComponent implements OnInit, OnDestroy {

    @ViewChild('eventMenu') eventMenu!: Menu;

    loading      = false;
    zippingFiles = false;
    viewMode: 'list' | 'card' = 'card';
    events:         Event[] = [];
    filteredEvents: Event[] = [];
    mobilePage     = 0;
    mobilePageSize = 10;

    searchKeyword  = '';
    selectedType:   EventType   | null = null;
    selectedStatus: EventStatus | null = null;

    typeOptions            = EVENT_TYPE_OPTIONS;
    statusOptions          = EVENT_STATUS_OPTIONS;
    participantTypeOptions = PARTICIPANT_TYPE_OPTIONS;

    menuItems:     MenuItem[] = [];
    selectedEvent: Event | null = null;

    manageParticipantsDialogVisible = false;
    manageFilesDialogVisible        = false;
    cancelDialogVisible             = false;
    postponeDialogVisible           = false;

    availableParticipants:    any[]         = [];
    selectedParticipantToAdd: any           = null;
    eventParticipants:        Participant[] = [];
    loadingParticipants = false;
    showCreateParticipantForm = false;
    newParticipant: any = {
        firstName: '', lastName: '', email: '',
        phoneNumber: '', structure: '', jobTitle: '',
        participantType: 'INTERNE'
    };

    eventFiles:   any[] = [];
    loadingFiles = false;

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
        private messageService:      MessageService,
        private agendaYearService:   AgendaYearService,
        private exportService:       ExportService,
        private destroyRef:          DestroyRef
    ) {
        effect(() => {
            const _year = this.agendaYearService.year();
            if (this.eventsLoaded) this.loadEvents();
        });
    }

    private eventsLoaded = false;

    ngOnInit(): void {
        this.loadEvents();
        this.loadAvailableParticipants();

        this.route.queryParams.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(params => {
                const createdId = params['created'];
                const updatedId = params['updated'];

                if (createdId) {
                    return this.eventService.getAllEvents().pipe(
                        map(events => ({ createdId, events }))
                    );
                }
                if (updatedId) {
                    setTimeout(() => {
                        this.router.navigate([], { queryParams: {}, replaceUrl: true });
                    }, 500);
                }
                return of(null);
            })
        ).subscribe(result => {
            if (!result) return;

            const { createdId, events } = result;
            const idx = events.findIndex(e => e.id === createdId);
            if (idx > 0) {
                const created = events.splice(idx, 1)[0];
                events.unshift(created);
            }
            this.events         = events;
            this.filteredEvents = events;
            this.messageService.add({
                severity: 'success',
                summary: 'Événement créé',
                detail: 'Le nouvel événement est en tête de liste',
                life: 4000
            });
            this.router.navigate([], { queryParams: {}, replaceUrl: true });
        });

        this.startStatusUpdateTimer();
    }

    ngOnDestroy(): void {
        if (this.statusTimer) clearInterval(this.statusTimer);
    }

    startStatusUpdateTimer(): void {
        this.updateEventStatuses();
        this.statusTimer = setInterval(() => this.updateEventStatuses(), 5 * 60 * 1000);
    }

    updateEventStatuses(): void {
        const now = new Date();
        const PROTECTED = ['ANNULER', 'REPORTER', 'REJETE', 'EN_ATTENTE_VALIDATION', 'TERMINE'];

        this.events.forEach(event => {
            const currentStatus = event.status as string;
            if (PROTECTED.includes(currentStatus)) return;

            const startTime  = event.schedules?.[0]?.startTime || '00:00:00';
            const endTime    = event.schedules?.[event.schedules.length - 1]?.endTime || '23:59:59';
            const eventStart = new Date(`${event.startDate}T${startTime}`);
            const eventEnd   = new Date(`${event.endDate}T${endTime}`);

            let newStatus: string | null = null;
            if      (now >= eventEnd)                     newStatus = 'TERMINE';
            else if (now >= eventStart && now < eventEnd) newStatus = 'EN_COURS';
            else if (now < eventStart)                    newStatus = 'PLANIFIE';

            if (!newStatus || currentStatus === newStatus) return;

            const previousStatus = currentStatus;
            event.status = newStatus as EventStatus;

            this.eventService.updateStatusOnly(event.id!, newStatus).subscribe({
                next:  () => {},
                error: () => { event.status = previousStatus as EventStatus; }
            });
        });

        this.applyFilters();
    }

    loadEvents(): void {
        this.loading = true;
        const year = this.agendaYearService.year();
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                const filtered = events.filter(e =>
                    new Date(e.startDate).getFullYear() === year
                );
                this.events         = filtered;
                this.filteredEvents = filtered;
                this.loading        = false;
                this.eventsLoaded   = true;
                this.updateEventStatuses();
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

    loadAvailableParticipants(): void {
        this.participantService.getAllParticipants().subscribe({
            next: (p) => {
                this.availableParticipants = p.map(x => ({
                    ...x,
                    displayName: `${x.firstName} ${x.lastName} (${x.email})`
                }));
            }
        });
    }


    getEventLieu(event: any): string {
        if (event.lieuType === 'INTERNE')
            return event.salle ? 'ASCELC — ' + event.salle : 'ASCELC';
        if (event.lieuType === 'VIRTUEL')
            return event.meetingLink ? 'Réunion en ligne' : 'Virtuel';
        if (event.lieuType === 'NATIONAL') {
            const parts = [event.nomLieu, event.ville].filter(Boolean);
            return parts.join(' — ') || 'Burkina Faso';
        }
        if (event.lieuType === 'INTERNATIONAL') {
            const parts = [event.nomLieu, event.ville, event.pays].filter(Boolean);
            return parts.join(', ') || 'International';
        }
        if (event.ville && event.pays) return event.ville + ', ' + event.pays;
        if (event.ville) return event.ville;
        if (event.pays)  return event.pays;
        return '';
    }

    getLieuIcon(event: any): string {
        if (event.lieuType === 'INTERNE')       return 'pi pi-building';
        if (event.lieuType === 'VIRTUEL')       return 'pi pi-video';
        if (event.lieuType === 'INTERNATIONAL') return 'pi pi-globe';
        return 'pi pi-map-marker';
    }


    showEventMenu(event: any, eventData: Event): void {
        this.selectedEvent = eventData;
        const status    = eventData.status as string;
        const isAnnule  = status === 'ANNULER';
        const isTermine = status === 'TERMINE';
        const canEdit   = !isAnnule && !isTermine;
        const canFile   = !isAnnule;

        this.menuItems = [
            { label: 'Voir détails',       icon: 'pi pi-eye',           command: () => this.viewEvent(eventData.id) },
            { label: 'Modifier',           icon: 'pi pi-pencil',        visible: canEdit, command: () => this.editEvent(eventData.id) },
            { separator: true, visible: canEdit || canFile },
            { label: 'Gérer participants', icon: 'pi pi-users',         visible: canEdit, command: () => this.openManageParticipants() },
            { label: 'Gérer fichiers',     icon: 'pi pi-paperclip',     visible: canFile, command: () => this.openManageFiles() },
            { separator: true },
            { label: 'Liste émargement',   icon: 'pi pi-download',      command: () => this.downloadAttendance(eventData.id) },
            { separator: true, visible: canEdit },
            { label: 'Annuler',            icon: 'pi pi-ban',           visible: canEdit, styleClass: 'text-red-500', command: () => this.showCancelDialog() },
            { label: 'Reporter',           icon: 'pi pi-calendar-plus', visible: canEdit, command: () => this.showPostponeDialog() },
            { separator: true },
            { label: 'Supprimer',          icon: 'pi pi-trash',         styleClass: 'text-red-500', command: () => this.confirmDelete(eventData) }
        ];

        this.eventMenu.toggle(event);
    }

    openManageParticipants(): void {
        if (!this.selectedEvent?.id) return;
        this.loadingParticipants      = true;
        this.showCreateParticipantForm = false;
        this.selectedParticipantToAdd  = null;
        this.resetNewParticipant();

        this.eventService.getEventParticipants(this.selectedEvent.id).subscribe({
            next: (participants) => {
                this.eventParticipants   = participants;
                this.loadingParticipants = false;
                this.updateAvailableParticipants();
                this.manageParticipantsDialogVisible = true;
            },
            error: () => { this.loadingParticipants = false; }
        });
    }

    updateAvailableParticipants(): void {
        this.participantService.getAllParticipants().subscribe({
            next: (all) => {
                this.availableParticipants = all
                    .filter(p => !this.eventParticipants.some(ep => ep.id === p.id))
                    .map(p => ({ ...p, displayName: `${p.firstName} ${p.lastName} (${p.email})` }));
            }
        });
    }

    resetNewParticipant(): void {
        this.newParticipant = {
            firstName: '', lastName: '', email: '',
            phoneNumber: '', structure: '', jobTitle: '', participantType: 'INTERNE'
        };
    }

    createAndAddParticipant(): void {
        if (!this.newParticipant.firstName || !this.newParticipant.lastName || !this.newParticipant.email) {
            this.messageService.add({ severity: 'warn', summary: 'Champs manquants', detail: 'Prénom, Nom et Email sont obligatoires' });
            return;
        }
        if (!this.selectedEvent?.id) return;
        this.loadingParticipants = true;

        const eventId = this.selectedEvent.id;

        this.participantService.createParticipant(this.newParticipant).pipe(
            switchMap(created => this.eventService.addParticipant(eventId, created))
        ).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Participant créé et ajouté' });
                this.resetNewParticipant();
                this.showCreateParticipantForm = false;
                this.refreshParticipants();
            },
            error: (err) => {
                this.loadingParticipants = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de créer/ajouter le participant' });
            }
        });
    }

    addParticipant(): void {
        if (!this.selectedParticipantToAdd || !this.selectedEvent?.id) return;
        this.loadingParticipants = true;

        this.eventService.addParticipant(this.selectedEvent.id, this.selectedParticipantToAdd).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Participant ajouté' });
                this.selectedParticipantToAdd = null;
                this.refreshParticipants();
            },
            error: (err) => {
                this.loadingParticipants = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible d\'ajouter' });
            }
        });
    }

    private refreshParticipants(): void {
        if (!this.selectedEvent?.id) return;
        this.eventService.getEventParticipants(this.selectedEvent.id).subscribe({
            next: (p) => {
                this.eventParticipants   = p;
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
            header: 'Confirmation', icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui', rejectLabel: 'Non',
            accept: () => this.removeParticipant(participant.id!)
        });
    }

    removeParticipant(participantId: string): void {
        if (!this.selectedEvent?.id) return;
        this.loadingParticipants = true;

        this.eventService.removeParticipant(this.selectedEvent.id, participantId).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Participant retiré' });
                this.refreshParticipants();
            },
            error: (err) => {
                this.loadingParticipants = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de retirer' });
            }
        });
    }

    openManageFiles(): void {
        if (!this.selectedEvent?.id) return;
        this.loadingFiles = true;
        this.fileService.getFilesByEvent(this.selectedEvent.id).subscribe({
            next: (files) => { this.eventFiles = files; this.loadingFiles = false; this.manageFilesDialogVisible = true; },
            error: () => { this.loadingFiles = false; }
        });
    }

    onFileSelected(event: any): void {
        if (!this.selectedEvent?.id) return;
        const files = event.target.files;
        const eventId = this.selectedEvent.id;
        if (!files.length) return;

        this.loadingFiles = true;

        const uploads = Array.from<File>(files).map((file: File) => {
            const formData = new FormData();
            formData.append('file',    file);
            formData.append('eventId', eventId);
            return this.fileService.uploadFile(formData).pipe(
                catchError(() => of(null))
            );
        });

        forkJoin(uploads).subscribe(results => {
            this.loadingFiles = false;
            const uploaded = results.filter(r => r !== null).length;
            const errors   = results.length - uploaded;

            if (uploaded > 0) {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: `${uploaded} fichier(s) ajouté(s)` });
                this.refreshFiles();
            }
            if (errors > 0) {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `${errors} fichier(s) n'ont pas pu être ajoutés` });
            }
        });

        event.target.value = '';
    }

    private refreshFiles(): void {
        if (!this.selectedEvent?.id) return;
        this.fileService.getFilesByEvent(this.selectedEvent.id).subscribe({
            next: (files) => { this.eventFiles = files; this.loadingFiles = false; this.loadEvents(); },
            error: () => { this.loadingFiles = false; }
        });
    }

    downloadFile(file: any): void {
        if (!file.id) return;
        this.fileService.downloadFile(file.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href = url; a.download = file.fileName; a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de télécharger' })
        });
    }

    confirmDeleteFile(file: any): void {
        this.confirmationService.confirm({
            message: `Supprimer "${file.fileName}" ?`,
            header: 'Confirmation', icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui', rejectLabel: 'Non',
            accept: () => this.deleteFile(file.id)
        });
    }

    deleteFile(fileId: string): void {
        this.loadingFiles = true;
        this.fileService.deleteFile(fileId).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Fichier supprimé' });
                this.refreshFiles();
            },
            error: () => { this.loadingFiles = false; }
        });
    }

    showCancelDialog(): void { this.cancelReason = ''; this.cancelDialogVisible = true; }

    cancelEvent(): void {
        if (!this.selectedEvent?.id || !this.cancelReason?.trim()) return;
        this.eventService.cancelEvent(this.selectedEvent.id, this.cancelReason).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Événement annulé' });
                this.cancelDialogVisible = false;
                this.loadEvents();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible' })
        });
    }

    showPostponeDialog(): void {
        if (this.selectedEvent) { this.newStartDate = this.selectedEvent.startDate; this.newEndDate = this.selectedEvent.endDate; }
        this.postponeDialogVisible = true;
    }

    postponeEvent(): void {
        if (!this.selectedEvent?.id || !this.newStartDate || !this.newEndDate) return;
        this.eventService.postponeEvent(this.selectedEvent.id, this.newStartDate, this.newEndDate).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Événement reporté' });
                this.postponeDialogVisible = false;
                this.loadEvents();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible' })
        });
    }

    applyFilters(): void {
        this.mobilePage = 0;
        this.filteredEvents = this.events.filter(event => {
            const kw = this.searchKeyword?.toLowerCase();
            const matchesKeyword = !kw || event.title.toLowerCase().includes(kw) || event.description?.toLowerCase().includes(kw);
            const matchesType    = !this.selectedType   || event.type   === this.selectedType;
            const matchesStatus  = !this.selectedStatus || event.status === this.selectedStatus;
            return matchesKeyword && matchesType && matchesStatus;
        });
    }

    resetFilters(): void {
        this.mobilePage     = 0;
        this.searchKeyword  = '';
        this.selectedType   = null;
        this.selectedStatus = null;
        this.filteredEvents = this.events;
    }

    get mobileEvents(): Event[] {
        const start = this.mobilePage * this.mobilePageSize;
        return this.filteredEvents.slice(start, start + this.mobilePageSize);
    }
    get mobileTotalPages(): number {
        return Math.ceil(this.filteredEvents.length / this.mobilePageSize);
    }

    onFiltersChange(filters: EventFilters): void {
        this.searchKeyword  = filters.search;
        this.selectedType   = filters.type   ?? null;
        this.selectedStatus = filters.status ?? null;
        this.applyFilters();
    }

    canEditEvent(event: Event): boolean {
        const status = event.status as string;
        return status !== 'ANNULER' && status !== 'TERMINE';
    }

    canCancelEvent(event: Event): boolean {
        const status = event.status as string;
        return status !== 'ANNULER' && status !== 'TERMINE';
    }

    canDeleteEvent(_event: Event): boolean {
        return true;
    }
    viewEventObj(event: Event): void  { this.viewEvent(event.id); }
    editEventObj(event: Event): void  { this.editEvent(event.id); }

    openCancelDialog(event: Event): void {
        this.selectedEvent = event;
        this.showCancelDialog();
    }

    openPostponeDialog(event: Event): void {
        this.selectedEvent = event;
        this.showPostponeDialog();
    }
    getTypeLabel(type: string):        string     { return EventTypeLabels[type]    || type; }
    getStatusLabel(status: string):    string     { return EventStatusLabels[status] || status; }
    getTypeSeverity(type: string):     TagSeverity { return getEventTypeSeverity(type); }
    getStatusSeverity(status: string): TagSeverity { return getEventStatusSeverity(status); }

    getEventTypeColor(type: string): string {
        const colors: Record<string, string> = {
            CONFERENCE:  '#1565C0',
            SEMINAIRE:   '#6A1B9A',
            ATELIER:     '#E65100',
            REUNION:     'var(--cge-vert-moyen)',
            CEREMONIE:   '#F57F17',
            FORMATION:   '#00695C',
            AUTRE:       '#546E7A'
        };
        return colors[type] || 'var(--cge-vert-moyen)';
    }

    get eventsThisMonth(): number {
        const now   = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return this.filteredEvents.filter(e =>
            new Date(e.startDate) <= end && new Date(e.endDate) >= start
        ).length;
    }

    get eventsPending(): number {
        return this.filteredEvents.filter(e => (e.status as string) === 'EN_ATTENTE_VALIDATION').length;
    }

    get eventsInProgress(): number {
        return this.filteredEvents.filter(e => (e.status as string) === 'EN_COURS').length;
    }

    hasAmendments(event: any): boolean {
        return !!(event.changeSuggestions && event.changeSuggestions.trim());
    }

    getFileIcon(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const icons: Record<string, string> = {
            'pdf': 'pi pi-file-pdf text-red-500', 'doc': 'pi pi-file-word text-blue-500',
            'docx': 'pi pi-file-word text-blue-500', 'xls': 'pi pi-file-excel text-green-500',
            'xlsx': 'pi pi-file-excel text-green-500', 'jpg': 'pi pi-image text-purple-500',
            'jpeg': 'pi pi-image text-purple-500', 'png': 'pi pi-image text-purple-500'
        };
        return icons[ext || ''] || 'pi pi-file text-gray-500';
    }

    formatFileSize(bytes: number): string {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    createEvent():          void { this.router.navigate(['/events/create']); }
    viewEvent(id?: string): void { if (id) this.router.navigate(['/events', id]); }
    editEvent(id?: string): void { if (id) this.router.navigate(['/events', id, 'edit']); }

    confirmDelete(event: Event): void {
        this.confirmationService.confirm({
            message: `Supprimer définitivement "${event.title}" ?`,
            header: 'Confirmation de suppression', icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer', rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteEvent(event.id!)
        });
    }

    deleteEvent(id: string): void {
        this.eventService.deleteEvent(id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Événement supprimé' });
                this.loadEvents();
            },
            error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible' })
        });
    }

    // ==========================================
    // EXPORT PDF (client-side)
    // ==========================================
    exportToPDF(): void {
        const today = new Date();

        const filters: string[] = [];
        if (this.searchKeyword) filters.push(`Recherche : "${this.searchKeyword}"`);
        if (this.selectedType)   filters.push(`Type : ${this.getTypeLabel(this.selectedType)}`);
        if (this.selectedStatus) filters.push(`Statut : ${this.getStatusLabel(this.selectedStatus)}`);
        const subtitle = filters.length
            ? `${this.filteredEvents.length} événement(s) — ${filters.join(' · ')}`
            : `${this.filteredEvents.length} événement(s) — Généré le ${today.toLocaleDateString('fr-FR')}`;

        const rows = this.filteredEvents.map(ev => [
            ev.title,
            this.getTypeLabel(ev.type),
            new Date(ev.startDate).toLocaleDateString('fr-FR'),
            new Date(ev.endDate).toLocaleDateString('fr-FR'),
            this.getStatusLabel(ev.status),
            this.getEventLieu(ev) || '—',
            (ev.participants?.length || 0).toString(),
            (ev.files?.length || 0).toString()
        ]);

        this.exportService.exportTableToPdf({
            title: 'Liste des événements — CGE Agenda',
            subtitle,
            columns: ['Titre', 'Type', 'Date début', 'Date fin', 'Statut', 'Lieu', 'Part.', 'Fichiers'],
            rows,
            columnStyles: {
                0: { cellWidth: 52 }, 1: { cellWidth: 24 },
                2: { cellWidth: 28 }, 3: { cellWidth: 28 },
                4: { cellWidth: 28 }, 5: { cellWidth: 48 },
                6: { cellWidth: 14, halign: 'center' },
                7: { cellWidth: 14, halign: 'center' }
            },
            footerLabel: 'CGE Agenda',
            filename: `evenements_${today.toISOString().split('T')[0]}.pdf`
        });

        this.messageService.add({ severity: 'success', summary: 'Export PDF', detail: `${this.filteredEvents.length} événement(s) exporté(s)` });
    }

 
    exportToExcel(): void {
        const evRows = this.filteredEvents.map(ev => ({
            'Titre':        ev.title,
            'Type':         this.getTypeLabel(ev.type),
            'Statut':       this.getStatusLabel(ev.status),
            'Date début':   new Date(ev.startDate).toLocaleDateString('fr-FR'),
            'Date fin':     new Date(ev.endDate).toLocaleDateString('fr-FR'),
            'Lieu':         this.getEventLieu(ev) || '—',
            'Participants': ev.participants?.length ?? 0,
            'Fichiers':     ev.files?.length ?? 0,
            'Description':  ev.description || '',
            'Créateur':     ev.creatorUsername || ''
        }));

        const filesRows: Record<string, unknown>[] = [];
        for (const ev of this.filteredEvents) {
            for (const f of (ev.files || [])) {
                filesRows.push({
                    'Événement':              ev.title,
                    'Fichier':                f.fileName,
                    'Type':                   f.fileType  || '—',
                    'Taille (Ko)':            f.fileSize  ? Math.round(f.fileSize / 1024) : '—',
                    'Description':            f.description || '—',
                    'Lien de téléchargement': f.id ? `${environments.apiUrl}/file/download/${f.id}` : '—'
                });
            }
        }

        this.exportService.exportToExcel([
            { name: 'Événements', rows: evRows },
            {
                name: 'Pièces jointes',
                rows: filesRows,
                emptyPlaceholder: { 'Info': 'Aucune pièce jointe pour les événements sélectionnés' },
                postProcess: (ws, rows) => {
                    const keys        = Object.keys(rows[0]);
                    const lienColIdx  = keys.indexOf('Lien de téléchargement');
                    const lienColLetter = XLSX.utils.encode_col(lienColIdx);
                    rows.forEach((row, i) => {
                        const cellRef = `${lienColLetter}${i + 2}`;
                        if (ws[cellRef] && row['Lien de téléchargement'] !== '—') {
                            ws[cellRef].l = { Target: row['Lien de téléchargement'], Tooltip: 'Télécharger le fichier' };
                        }
                    });
                }
            }
        ], `evenements_${new Date().toISOString().split('T')[0]}.xlsx`);

        const totalFichiers = this.filteredEvents.reduce((sum, ev) => sum + (ev.files?.length ?? 0), 0);
        this.messageService.add({
            severity: 'success',
            summary:  'Export Excel',
            detail:   `${this.filteredEvents.length} événement(s) — ${totalFichiers} pièce(s) jointe(s)`
        });
    }

    exportFilesAsZip(): void {
        const eventsWithFiles = this.filteredEvents.filter(ev => ev.files && ev.files.length > 0);

        if (!eventsWithFiles.length) {
            this.messageService.add({ severity: 'warn', summary: 'Pièces jointes', detail: 'Aucun fichier joint dans les événements affichés' });
            return;
        }

        this.zippingFiles = true;
        const zip = new JSZip();

        const downloads$ = eventsWithFiles.flatMap(ev =>
            (ev.files || []).filter(f => !!f.id).map(f =>
                new Promise<void>((resolve) => {
                    this.fileService.downloadFile(f.id!).subscribe({
                        next: (blob) => {
                            const folderName = ev.title.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 60);
                            zip.folder(folderName)!.file(f.fileName, blob);
                            resolve();
                        },
                        error: () => resolve() 
                    });
                })
            )
        );

        Promise.all(downloads$).then(() => {
            zip.generateAsync({ type: 'blob' }).then(content => {
                const url = URL.createObjectURL(content);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = `pieces_jointes_${new Date().toISOString().split('T')[0]}.zip`;
                a.click();
                URL.revokeObjectURL(url);
                this.zippingFiles = false;
                const total = eventsWithFiles.reduce((s, ev) => s + (ev.files?.length ?? 0), 0);
                this.messageService.add({ severity: 'success', summary: 'Téléchargement', detail: `${total} fichier(s) compressé(s) dans le ZIP` });
            });
        });
    }

    openReport(): void {
        this.router.navigate(['/events/report']);
    }

    downloadAttendance(id?: string): void {
        if (!id) return;
        this.eventService.generateAttendanceSheet(id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = `liste_emargement_${id}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de télécharger' })
        });
    }
}
