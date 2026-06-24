import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { CardModule }          from 'primeng/card';
import { ButtonModule }        from 'primeng/button';
import { TagModule }           from 'primeng/tag';
import { DividerModule }       from 'primeng/divider';
import { ToastModule }         from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { FileUploadModule }    from 'primeng/fileupload';
import { DialogModule }        from 'primeng/dialog';
import { ImageModule }         from 'primeng/image';
import { SkeletonModule }      from 'primeng/skeleton';
import { TextareaModule }      from 'primeng/textarea';
import { InputTextModule }     from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EventService } from '../../service/event.service';
import { FileService }  from '../../service/file.service';
import { AuthService }  from '../../service/auth.service';
import {
    Event,
    FileUpload,
    EventTypeLabels,
    EventStatusLabels,
    getEventTypeSeverity,
    getEventStatusSeverity,
    TagSeverity
} from '../../models';

@Component({
    selector: 'app-event-detail',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        CardModule, ButtonModule, TagModule,
        DividerModule, ToastModule, ConfirmDialogModule,
        TooltipModule, FileUploadModule, DialogModule,
        ImageModule, SkeletonModule, TextareaModule, InputTextModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>

<!-- ================================================
     DIALOG : PRÉVISUALISATION FICHIER
     ================================================ -->
<p-dialog [(visible)]="filePreviewVisible" [modal]="true"
          [style]="{width:'90vw', maxWidth:'1200px'}"
          [header]="selectedFile?.fileName"
          [draggable]="false" [resizable]="false"
          (onHide)="closePreview()">
    <div class="preview-container">
        <img *ngIf="isImage(selectedFile?.fileName)" [src]="filePreviewUrl"
             [alt]="selectedFile?.fileName" class="preview-image">
        <iframe *ngIf="isPDF(selectedFile?.fileName)"
                [src]="filePreviewUrl" class="preview-iframe"></iframe>
        <div *ngIf="!isImage(selectedFile?.fileName) && !isPDF(selectedFile?.fileName)"
             class="no-preview">
            <i class="pi pi-file"></i>
            <p>Prévisualisation non disponible</p>
            <p-button label="Télécharger" icon="pi pi-download" severity="help"
                      (onClick)="downloadFileOnly(selectedFile!)"></p-button>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Télécharger" icon="pi pi-download" [outlined]="true"
                  (onClick)="downloadFileOnly(selectedFile!)"></p-button>
        <p-button label="Fermer" icon="pi pi-times" severity="secondary"
                  (onClick)="closePreview()"></p-button>
    </ng-template>
</p-dialog>

<!-- ================================================
     DIALOGS CGE
     ================================================ -->

<!-- Valider -->
<p-dialog [(visible)]="validateDialogVisible" [modal]="true" [style]="{width:'520px'}"
          header="Valider l'événement">
    <div class="dlg-body">
        <div class="dlg-banner dlg-green">
            <i class="pi pi-check-circle"></i>
            <div><strong>{{ event?.title }}</strong>
                <small>{{ event?.startDate | date:'dd/MM/yyyy' }} → {{ event?.endDate | date:'dd/MM/yyyy' }}</small>
            </div>
        </div>
        <label class="dlg-label">Commentaire <span class="dlg-opt">(optionnel)</span></label>
        <textarea pTextarea [(ngModel)]="validateComment" rows="4"
                  placeholder="Commentaire pour le créateur..." class="w-full"></textarea>
        <div class="dlg-info"><i class="pi pi-info-circle"></i>
            Le créateur sera notifié. Les invitations seront envoyées aux participants.</div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="validateDialogVisible = false"/>
        <p-button label="Confirmer la validation" icon="pi pi-check" severity="success"
                  [loading]="actionLoading" (onClick)="validateEvent()"/>
    </ng-template>
</p-dialog>

<!-- Modifications -->
<p-dialog [(visible)]="changesDialogVisible" [modal]="true" [style]="{width:'520px'}"
          header="Demander des modifications">
    <div class="dlg-body">
        <div class="dlg-banner dlg-orange">
            <i class="pi pi-wrench"></i>
            <div><strong>{{ event?.title }}</strong></div>
        </div>
        <label class="dlg-label">Modifications demandées <span class="text-red-500">*</span></label>
        <textarea pTextarea [(ngModel)]="changeSuggestions" rows="5"
                  placeholder="Décrivez les modifications à apporter..." class="w-full"></textarea>
        <div class="dlg-info dlg-info-orange"><i class="pi pi-info-circle"></i>
            Le créateur recevra vos suggestions par email et verra une notification dans l'app.</div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="changesDialogVisible = false"/>
        <p-button label="Envoyer les suggestions" icon="pi pi-send" severity="warn"
                  [loading]="actionLoading" [disabled]="!changeSuggestions.trim()"
                  (onClick)="requestChanges()"/>
    </ng-template>
</p-dialog>

<!-- Déléguer -->
<p-dialog [(visible)]="delegateDialogVisible" [modal]="true" [style]="{width:'540px'}"
          header="Déléguer la participation">
    <div class="dlg-body">
        <div class="dlg-banner dlg-purple">
            <i class="pi pi-user-plus"></i>
            <div><strong>{{ event?.title }}</strong>
                <small>{{ event?.startDate | date:'dd/MM/yyyy' }}</small>
            </div>
        </div>
        <div class="dlg-info mb-3"><i class="pi pi-info-circle"></i>
            Désignez la personne qui représentera le CGE à cet événement.</div>
        <div class="dlg-field">
            <label class="dlg-label">Nom du délégué <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="delegueNom" class="w-full" placeholder="Prénom et Nom"/>
        </div>
        <div class="dlg-field">
            <label class="dlg-label">Email du délégué <span class="text-red-500">*</span></label>
            <input pInputText [(ngModel)]="delegueEmail" class="w-full"
                   placeholder="email@ascelc.bf" type="email"/>
        </div>
        <div class="dlg-field">
            <label class="dlg-label">Motif <span class="dlg-opt">(optionnel)</span></label>
            <textarea pTextarea [(ngModel)]="delegueMotif" rows="3"
                      placeholder="Raison de la délégation..." class="w-full"></textarea>
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="delegateDialogVisible = false"/>
        <p-button label="Confirmer la délégation" icon="pi pi-send" severity="help"
                  [loading]="actionLoading"
                  [disabled]="!delegueNom.trim() || !delegueEmail.trim()"
                  (onClick)="delegateParticipation()"/>
    </ng-template>
</p-dialog>

<!-- Observation -->
<p-dialog [(visible)]="observationDialogVisible" [modal]="true" [style]="{width:'540px'}"
          header="Ajouter une observation">
    <div class="dlg-body">
        <div class="dlg-banner dlg-blue">
            <i class="pi pi-comment"></i>
            <div><strong>{{ event?.title }}</strong></div>
        </div>
        <label class="dlg-label">Observation / Note CGE
            <span class="dlg-opt">(remplace l'observation précédente)</span>
        </label>
        <textarea pTextarea [(ngModel)]="observationText" rows="6"
                  placeholder="Saisir une observation, note ou commentaire..." class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="observationDialogVisible = false"/>
        <p-button label="Enregistrer" icon="pi pi-save" [loading]="actionLoading"
                  [disabled]="!observationText.trim()" (onClick)="saveObservation()"/>
    </ng-template>
</p-dialog>

<!-- Rejeter -->
<p-dialog [(visible)]="rejectDialogVisible" [modal]="true" [style]="{width:'520px'}"
          header="Rejeter l'événement">
    <div class="dlg-body">
        <div class="dlg-banner dlg-red">
            <i class="pi pi-times-circle"></i>
            <div><strong>{{ event?.title }}</strong></div>
        </div>
        <div class="dlg-alert-reject">
            <i class="pi pi-exclamation-triangle"></i>
            Cette action est définitive. Le créateur sera informé.
        </div>
        <label class="dlg-label">Raison du rejet <span class="text-red-500">*</span></label>
        <textarea pTextarea [(ngModel)]="rejectReason" rows="5"
                  placeholder="Expliquez la raison du rejet..." class="w-full"></textarea>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Annuler" [text]="true" severity="secondary" (onClick)="rejectDialogVisible = false"/>
        <p-button label="Confirmer le rejet" icon="pi pi-times" severity="danger"
                  [loading]="actionLoading" [disabled]="!rejectReason.trim()"
                  (onClick)="rejectEvent()"/>
    </ng-template>
</p-dialog>

<!-- ================================================
     PAGE
     ================================================ -->
<div class="ed-page">

    <!-- LOADING -->
    <ng-container *ngIf="loading">
        <div class="ed-hero-skeleton"></div>
        <div class="ed-grid" style="margin-top:20px">
            <div><p-skeleton height="3rem" styleClass="mb-3"></p-skeleton>
                <p-skeleton height="8rem" styleClass="mb-3"></p-skeleton>
                <p-skeleton height="5rem"></p-skeleton>
            </div>
            <div><p-skeleton height="10rem"></p-skeleton></div>
        </div>
    </ng-container>

    <!-- ERREUR -->
    <div *ngIf="!loading && !event" class="ed-error">
        <div class="ed-error-icon"><i class="pi pi-exclamation-triangle"></i></div>
        <h3>Événement introuvable</h3>
        <p>L'événement demandé n'existe pas ou a été supprimé.</p>
        <p-button label="Retour à la liste" icon="pi pi-arrow-left" severity="success"
                  (onClick)="goBack()"></p-button>
    </div>

    <ng-container *ngIf="!loading && event">

        <!-- ALERTE AMENDEMENTS -->
        <div *ngIf="isACorriger || hasAmendments" class="ed-alert ed-alert-warn">
            <div class="ed-alert-icon"><i class="pi pi-wrench"></i></div>
            <div>
                <strong>Le CGE a demandé des corrections :</strong>
                <p>{{ getChangeSuggestions() }}</p>
                <p class="ed-alert-hint">
                    Apportez les corrections et enregistrez — l'événement sera automatiquement re-soumis.
                </p>
            </div>
        </div>

        <!-- ALERTE REJET -->
        <div *ngIf="isRejete" class="ed-alert ed-alert-danger">
            <div class="ed-alert-icon"><i class="pi pi-times-circle"></i></div>
            <div>
                <strong>Cet événement a été rejeté par le CGE :</strong>
                <p>{{ getRejectionReason() }}</p>
            </div>
        </div>

        <!-- ================================================
             HERO BANNER
             ================================================ -->
        <div class="ed-hero" [style.background]="heroGradient">

            <!-- Bouton retour -->
            <button class="ed-back-btn" (click)="goBack()">
                <i class="pi pi-arrow-left"></i>
                Événements
            </button>

            <div class="ed-hero-inner">
                <!-- Gauche : icône + titre + badges -->
                <div class="ed-hero-left">
                    <div class="ed-hero-type-icon">
                        <i class="pi" [ngClass]="getEventTypeIcon()"></i>
                    </div>
                    <div class="ed-hero-text">
                        <div class="ed-hero-type-label">{{ getTypeLabel(event.type) }}</div>
                        <h1 class="ed-hero-title">{{ event.title }}</h1>
                        <div class="ed-hero-badges">
                            <p-tag [value]="getStatusLabel(event.status)"
                                   [severity]="getStatusSeverity(event.status)"
                                   [rounded]="true"></p-tag>
                            <span *ngIf="event?.status === 'ANNULER' || event?.status === 'TERMINE'"
                                  class="ed-badge ed-badge-lock">
                                <i class="pi pi-lock"></i> Lecture seule
                            </span>
                            <span *ngIf="isEnAttente" class="ed-badge ed-badge-pending">
                                <i class="pi pi-clock"></i> En attente de validation CGE
                            </span>
                            <span *ngIf="isBrouillon" class="ed-badge ed-badge-draft">
                                <i class="pi pi-file-edit"></i> Brouillon
                            </span>
                            <span *ngIf="isACorriger" class="ed-badge ed-badge-warn">
                                <i class="pi pi-wrench"></i> À corriger
                            </span>
                            <span *ngIf="event?.estDelegue" class="ed-badge ed-badge-delegue">
                                <i class="pi pi-user-plus"></i> Délégué à {{ event.delegueNom }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Séparateur vertical -->
                <div class="ed-hero-sep"></div>

                <!-- Droite : méta-infos clés -->
                <div class="ed-hero-meta">
                    <div class="ed-meta-chip">
                        <i class="pi pi-calendar"></i>
                        <div>
                            <span class="meta-lbl">Début</span>
                            <span class="meta-val">{{ event.startDate | date:'dd MMM yyyy' }}</span>
                        </div>
                    </div>
                    <div class="ed-meta-chip">
                        <i class="pi pi-calendar-clock"></i>
                        <div>
                            <span class="meta-lbl">Fin</span>
                            <span class="meta-val">{{ event.endDate | date:'dd MMM yyyy' }}</span>
                        </div>
                    </div>
                    <div class="ed-meta-chip" *ngIf="getLieuFormate()">
                        <i class="pi pi-map-marker"></i>
                        <div>
                            <span class="meta-lbl">Lieu</span>
                            <span class="meta-val">{{ getLieuFormate() }}</span>
                        </div>
                    </div>
                    <div class="ed-meta-chip">
                        <i class="pi pi-clock"></i>
                        <div>
                            <span class="meta-lbl">Durée</span>
                            <span class="meta-val">{{ calculateDuration() }} jour(s)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ================================================
             BARRE D'ACTIONS
             ================================================ -->
        <div class="ed-actions-bar">
            <p-button label="Retour" icon="pi pi-arrow-left" [text]="true"
                      severity="secondary" (onClick)="goBack()"></p-button>

            <div class="ed-actions-right">
                <!-- Brouillon : soumettre -->
                <p-button *ngIf="isBrouillon && !canValidate"
                          label="Soumettre à validation" icon="pi pi-send" severity="info"
                          [loading]="actionLoading" (onClick)="submitDraft()">
                </p-button>

                <!-- CGE : EN_ATTENTE -->
                <ng-container *ngIf="isEnAttente && canValidate">
                    <p-button label="Valider" icon="pi pi-check" severity="success"
                              (onClick)="validateDialogVisible = true"></p-button>
                    <p-button label="Modifications" icon="pi pi-wrench" severity="warn"
                              [outlined]="true" (onClick)="changesDialogVisible = true"></p-button>
                    <p-button label="Rejeter" icon="pi pi-times" severity="danger"
                              [outlined]="true" (onClick)="rejectDialogVisible = true"></p-button>
                </ng-container>

                <!-- CGE : A_CORRIGER -->
                <p-button *ngIf="isACorriger && canValidate"
                          label="Rejeter définitivement" icon="pi pi-times" severity="danger"
                          [outlined]="true" (onClick)="rejectDialogVisible = true">
                </p-button>

                <!-- CGE : PLANIFIE / EN_COURS -->
                <ng-container *ngIf="isOperational && canValidate">
                    <p-button label="Observation" icon="pi pi-comment" severity="info"
                              [outlined]="true" (onClick)="openObservationDialog()"></p-button>
                    <p-button label="Déléguer" icon="pi pi-user-plus" severity="help"
                              [outlined]="true" (onClick)="openDelegateDialog()"></p-button>
                </ng-container>

                <!-- Modifier -->
                <p-button *ngIf="!isEnAttente && event?.status !== 'ANNULER' && event?.status !== 'TERMINE' && event?.status !== 'REJETE'"
                          label="Modifier" icon="pi pi-pencil" [outlined]="true"
                          (onClick)="editEvent()"></p-button>

                <!-- Émargement -->
                <p-button label="Liste émargement" icon="pi pi-download"
                          severity="secondary" [outlined]="true"
                          (onClick)="downloadAttendance()"></p-button>
            </div>
        </div>

        <!-- ================================================
             CONTENU PRINCIPAL
             ================================================ -->
        <div class="ed-grid">

            <!-- COLONNE GAUCHE -->
            <div class="ed-col-left">

                <!-- Description -->
                <div class="ed-card" *ngIf="event.description">
                    <div class="ed-section-hd">
                        <div class="ed-section-icon" style="background:#e8f5e9">
                            <i class="pi pi-align-left" style="color:#228B22"></i>
                        </div>
                        <h3>Description</h3>
                    </div>
                    <p class="ed-description">{{ event.description }}</p>
                </div>

                <!-- Horaires -->
                <div class="ed-card" *ngIf="event.schedules && event.schedules.length > 0">
                    <div class="ed-section-hd">
                        <div class="ed-section-icon" style="background:#e3f2fd">
                            <i class="pi pi-clock" style="color:#1976D2"></i>
                        </div>
                        <h3>Horaires</h3>
                        <span class="ed-badge-count">{{ event.schedules.length }}</span>
                    </div>
                    <div class="ed-schedules">
                        <div *ngFor="let schedule of getVisibleSchedules()" class="ed-schedule-item">
                            <div class="ed-schedule-date">
                                <i class="pi pi-calendar"></i>
                                <span>{{ schedule.dateJour | date:'EEE dd MMM yyyy' }}</span>
                            </div>
                            <div class="ed-schedule-time">
                                <i class="pi pi-clock"></i>
                                <span>{{ schedule.startTime }} — {{ schedule.endTime }}</span>
                            </div>
                            <div class="ed-schedule-addr" *ngIf="schedule.address">
                                <i class="pi pi-map-marker"></i>
                                <span>{{ schedule.address }}</span>
                            </div>
                        </div>
                    </div>
                    <div *ngIf="event.schedules.length > 3" class="ed-schedules-toggle">
                        <p-button
                            [label]="showAllSchedules ? 'Masquer' : ('Voir ' + (event.schedules.length - 3) + ' de plus')"
                            [icon]="showAllSchedules ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                            [text]="true" severity="secondary"
                            (onClick)="showAllSchedules = !showAllSchedules">
                        </p-button>
                    </div>
                </div>

                <!-- Lieu -->
                <div class="ed-card" *ngIf="getLieuFormate()">
                    <div class="ed-section-hd">
                        <div class="ed-section-icon" style="background:#fff3e0">
                            <i class="pi pi-map-marker" style="color:#ff9800"></i>
                        </div>
                        <h3>Lieu</h3>
                    </div>
                    <div class="ed-info-row">
                        <i [class]="getLieuIconDetail()" class="ed-row-icon"></i>
                        <span>{{ getLieuFormate() }}</span>
                    </div>
                    <div class="ed-info-row" *ngIf="event.meetingLink">
                        <i class="pi pi-video ed-row-icon" style="color:#9c27b0"></i>
                        <a [href]="event.meetingLink" target="_blank" class="ed-visio-link">
                            <i class="pi pi-external-link"></i>
                            Rejoindre la visioconférence
                        </a>
                    </div>
                </div>

                <!-- Participants -->
                <div class="ed-card">
                    <div class="ed-section-hd">
                        <div class="ed-section-icon" style="background:#f3e5f5">
                            <i class="pi pi-users" style="color:#7b1fa2"></i>
                        </div>
                        <h3>Participants</h3>
                        <span class="ed-badge-count">{{ event.participants?.length || 0 }}</span>
                    </div>

                    <div *ngIf="event.participants && event.participants.length > 0"
                         class="ed-participants">
                        <div *ngFor="let p of event.participants" class="ed-participant">
                            <div class="ed-avatar"
                                 [style.background]="getAvatarColor(p.firstName + p.lastName)">
                                {{ getInitials(p.firstName, p.lastName) }}
                            </div>
                            <div class="ed-participant-info">
                                <div class="ed-participant-name">
                                    {{ p.firstName }} {{ p.lastName }}
                                </div>
                                <div class="ed-participant-meta">
                                    <span><i class="pi pi-envelope"></i> {{ p.email }}</span>
                                    <span *ngIf="p.phoneNumber">
                                        <i class="pi pi-phone"></i> {{ p.phoneNumber }}
                                    </span>
                                    <span *ngIf="p.structure">
                                        <i class="pi pi-building"></i> {{ p.structure }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="!event.participants || event.participants.length === 0"
                         class="ed-empty">
                        <i class="pi pi-users"></i>
                        <p>Aucun participant enregistré</p>
                    </div>
                </div>

            </div>

            <!-- COLONNE DROITE -->
            <div class="ed-col-right">

                <!-- Mini stats -->
                <div class="ed-stats-row">
                    <div class="ed-stat-mini">
                        <i class="pi pi-users" style="color:#7b1fa2"></i>
                        <span class="ed-stat-num">{{ event.participants?.length || 0 }}</span>
                        <span class="ed-stat-lbl">Participants</span>
                    </div>
                    <div class="ed-stat-mini">
                        <i class="pi pi-paperclip" style="color:#228B22"></i>
                        <span class="ed-stat-num">{{ files.length }}</span>
                        <span class="ed-stat-lbl">Fichiers</span>
                    </div>
                    <div class="ed-stat-mini">
                        <i class="pi pi-clock" style="color:#1976D2"></i>
                        <span class="ed-stat-num">{{ calculateDuration() }}</span>
                        <span class="ed-stat-lbl">Jour(s)</span>
                    </div>
                </div>

                <!-- Observation CGE -->
                <div class="ed-card ed-card-obs" *ngIf="event?.validationComment">
                    <div class="ed-section-hd">
                        <div class="ed-section-icon" style="background:#e3f2fd">
                            <i class="pi pi-comment" style="color:#1976D2"></i>
                        </div>
                        <h3>Observation CGE</h3>
                        <p-button *ngIf="canValidate && isOperational"
                                  icon="pi pi-pencil" [text]="true" size="small"
                                  ariaLabel="Modifier l'observation"
                                  pTooltip="Modifier" (onClick)="openObservationDialog()">
                        </p-button>
                    </div>
                    <blockquote class="ed-observation">{{ event.validationComment }}</blockquote>
                </div>

                <!-- Délégation CGE -->
                <div class="ed-card ed-card-delegue" *ngIf="event?.delegueNom">
                    <div class="ed-section-hd">
                        <div class="ed-section-icon" style="background:#f3e5f5">
                            <i class="pi pi-user-plus" style="color:#7c3aed"></i>
                        </div>
                        <h3>Délégation CGE</h3>
                        <p-button *ngIf="canValidate && isOperational"
                                  icon="pi pi-pencil" [text]="true" size="small"
                                  ariaLabel="Modifier la délégation"
                                  pTooltip="Modifier" (onClick)="openDelegateDialog()">
                        </p-button>
                    </div>
                    <div class="ed-delegue-row">
                        <div class="ed-avatar ed-avatar-sm" style="background:#7c3aed">
                            {{ getDelegueInitials() }}
                        </div>
                        <div>
                            <div class="ed-delegue-name">{{ event.delegueNom }}</div>
                            <div class="ed-delegue-email">{{ event.delegueEmail }}</div>
                            <div class="ed-delegue-motif" *ngIf="event.delegueMotif">
                                {{ event.delegueMotif }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Fichiers -->
                <div class="ed-card">
                    <div class="ed-section-hd">
                        <div class="ed-section-icon" style="background:#e8f5e9">
                            <i class="pi pi-paperclip" style="color:#228B22"></i>
                        </div>
                        <h3>Fichiers</h3>
                        <span class="ed-badge-count">{{ files.length }}</span>
                        <p-button *ngIf="!isEnAttente" icon="pi pi-upload" [text]="true"
                                  size="small" ariaLabel="Ajouter des fichiers"
                                  pTooltip="Ajouter des fichiers"
                                  (onClick)="triggerFileUpload()">
                        </p-button>
                    </div>

                    <input #hiddenFileInput type="file" multiple style="display:none"
                           accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                           (change)="onHiddenFileChange($event)" />

                    <div *ngIf="loadingFiles" class="ed-loading-files">
                        <i class="pi pi-spin pi-spinner"></i>
                    </div>

                    <div *ngIf="!loadingFiles && files.length > 0" class="ed-files">
                        <div *ngFor="let file of files" class="ed-file-item">
                            <div class="ed-file-thumb" (click)="openFilePreview(file)">
                                <img *ngIf="isImage(file.fileName)"
                                     [src]="getFileUrl(file.id!)" [alt]="file.fileName"
                                     class="ed-file-img">
                                <i *ngIf="!isImage(file.fileName)"
                                   [class]="getFileIcon(file.fileName)"></i>
                            </div>
                            <div class="ed-file-info" (click)="openFilePreview(file)">
                                <span class="ed-file-name">{{ file.fileName }}</span>
                                <span class="ed-file-size">{{ formatFileSize(file.fileSize) }}</span>
                            </div>
                            <div class="ed-file-btns">
                                <p-button icon="pi pi-eye" [rounded]="true" [text]="true"
                                          severity="secondary" size="small"
                                          ariaLabel="Prévisualiser le fichier"
                                          (onClick)="openFilePreview(file)"></p-button>
                                <p-button icon="pi pi-download" [rounded]="true" [text]="true"
                                          severity="secondary" size="small"
                                          ariaLabel="Télécharger le fichier"
                                          (onClick)="downloadFileOnly(file)"></p-button>
                                <p-button *ngIf="!isEnAttente" icon="pi pi-trash"
                                          [rounded]="true" [text]="true" severity="danger"
                                          size="small"
                                          ariaLabel="Supprimer le fichier"
                                          (onClick)="confirmDeleteFile(file)"></p-button>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="!loadingFiles && files.length === 0" class="ed-empty">
                        <i class="pi pi-inbox"></i>
                        <p>Aucun fichier joint</p>
                        <p-button *ngIf="!isEnAttente" label="Ajouter" icon="pi pi-upload"
                                  size="small" severity="success"
                                  ariaLabel="Ajouter des fichiers à cet événement"
                                  (onClick)="triggerFileUpload()"></p-button>
                    </div>
                </div>

            </div>
        </div>

    </ng-container>
</div>
    `,
    styleUrls: ['./event-detail.css']
})
export class EventDetailComponent implements OnInit {
    loading      = false;
    loadingFiles = false;
    actionLoading = false;
    event?: Event;
    files: FileUpload[] = [];
    eventId?: string;

    filePreviewVisible = false;
    selectedFile?: FileUpload;
    filePreviewUrl: any;

    validateDialogVisible    = false;
    changesDialogVisible     = false;
    rejectDialogVisible      = false;
    delegateDialogVisible    = false;
    observationDialogVisible = false;
    validateComment   = '';
    changeSuggestions = '';
    rejectReason      = '';
    delegueNom        = '';
    delegueEmail      = '';
    delegueMotif      = '';
    observationText   = '';

    showAllSchedules = false;
    @ViewChild('hiddenFileInput') hiddenFileInput!: ElementRef;

    constructor(
        private route:               ActivatedRoute,
        private router:              Router,
        private eventService:        EventService,
        private fileService:         FileService,
        private authService:         AuthService,
        private messageService:      MessageService,
        private confirmationService: ConfirmationService,
        private sanitizer:           DomSanitizer
    ) {}

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('id') || undefined;
        if (this.eventId) {
            this.loadEvent();
            this.loadFiles();
        }
    }

    loadEvent(): void {
        if (!this.eventId) return;
        this.loading = true;
        this.eventService.getEventById(this.eventId).subscribe({
            next: (event: Event) => { this.event = event; this.loading = false; },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger l\'événement', life: 3000 });
                this.loading = false;
            }
        });
    }

    loadFiles(): void {
        if (!this.eventId) return;
        this.loadingFiles = true;
        this.fileService.getFilesByEvent(this.eventId).subscribe({
            next:  (files) => { this.files = files; this.loadingFiles = false; },
            error: ()      => { this.loadingFiles = false; }
        });
    }

    // ==========================================
    // PERMISSIONS
    // ==========================================
    get isBrouillon():   boolean { return (this.event?.status as string) === 'BROUILLON'; }
    get isEnAttente():   boolean { return (this.event?.status as string) === 'EN_ATTENTE_VALIDATION'; }
    get isACorriger():   boolean { return (this.event?.status as string) === 'A_CORRIGER'; }
    get canValidate():   boolean { return this.authService.canValidateEvent; }
    get isRejete():      boolean { return (this.event?.status as string) === 'REJETE'; }
    get isPlanifie():    boolean { return (this.event?.status as string) === 'PLANIFIE'; }
    get isEnCours():     boolean { return (this.event?.status as string) === 'EN_COURS'; }
    get isOperational(): boolean { return this.isPlanifie || this.isEnCours; }

    get hasAmendments(): boolean {
        const e = this.event as any;
        return !!(e?.changeSuggestions && e.changeSuggestions.trim());
    }

    getRejectionReason():  string { return (this.event as any)?.rejectionReason  || ''; }
    getChangeSuggestions():string { return (this.event as any)?.changeSuggestions || ''; }

    // ==========================================
    // HORAIRES
    // ==========================================
    getVisibleSchedules(): any[] {
        if (!this.event?.schedules) return [];
        if (this.showAllSchedules || this.event.schedules.length <= 3) return this.event.schedules;
        return this.event.schedules.slice(0, 3);
    }

    // ==========================================
    // LIEU ENRICHI
    // ==========================================
    getLieuFormate(): string {
        if (!this.event) return '';
        const e = this.event as any;
        if (e.lieuType === 'INTERNE')       return e.salle ? 'ASCELC — ' + e.salle : 'ASCELC';
        if (e.lieuType === 'VIRTUEL')       return e.meetingLink ? 'Réunion en ligne' : 'Virtuel';
        if (e.lieuType === 'NATIONAL') {
            const parts = [e.nomLieu, this.event.ville].filter(Boolean);
            return parts.join(' — ') || 'Burkina Faso';
        }
        if (e.lieuType === 'INTERNATIONAL') {
            const parts = [e.nomLieu, this.event.ville, this.event.pays].filter(Boolean);
            return parts.join(', ') || 'International';
        }
        if (this.event.ville && this.event.pays) return this.event.ville + ', ' + this.event.pays;
        if (this.event.ville) return this.event.ville;
        if (this.event.pays)  return this.event.pays;
        return '';
    }

    getLieuIconDetail(): string {
        const e = this.event as any;
        if (e?.lieuType === 'INTERNE')       return 'pi pi-building';
        if (e?.lieuType === 'VIRTUEL')       return 'pi pi-video';
        if (e?.lieuType === 'INTERNATIONAL') return 'pi pi-globe';
        return 'pi pi-map-marker';
    }

    // ==========================================
    // ACTIONS BROUILLON
    // ==========================================
    submitDraft(): void {
        if (!this.eventId) return;
        this.actionLoading = true;
        this.eventService.submitDraft(this.eventId).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Soumis', detail: 'L\'événement a été soumis à la CGE pour validation.', life: 5000 });
                this.actionLoading = false;
                this.loadEvent();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de soumettre' });
                this.actionLoading = false;
            }
        });
    }

    // ==========================================
    // ACTIONS CGE
    // ==========================================
    validateEvent(): void {
        if (!this.eventId) return;
        this.actionLoading = true;
        this.eventService.validateEvent(this.eventId, this.validateComment).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Validé', detail: 'Événement validé. Invitations envoyées.', life: 5000 });
                this.validateDialogVisible = false; this.actionLoading = false; this.loadEvent();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de valider' });
                this.actionLoading = false;
            }
        });
    }

    requestChanges(): void {
        if (!this.eventId || !this.changeSuggestions.trim()) return;
        this.actionLoading = true;
        this.eventService.requestChanges(this.eventId, this.changeSuggestions).subscribe({
            next: () => {
                this.messageService.add({ severity: 'warn', summary: 'Modifications demandées', detail: 'Suggestions envoyées au créateur.', life: 5000 });
                this.changesDialogVisible = false; this.actionLoading = false; this.loadEvent();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible d\'envoyer les suggestions' });
                this.actionLoading = false;
            }
        });
    }

    rejectEvent(): void {
        if (!this.eventId || !this.rejectReason.trim()) return;
        this.actionLoading = true;
        this.eventService.rejectEvent(this.eventId, this.rejectReason).subscribe({
            next: () => {
                this.messageService.add({ severity: 'error', summary: 'Rejeté', detail: 'Événement rejeté. Créateur notifié.', life: 5000 });
                this.rejectDialogVisible = false; this.actionLoading = false; this.loadEvent();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible de rejeter' });
                this.actionLoading = false;
            }
        });
    }

    openObservationDialog(): void {
        this.observationText = this.event?.validationComment || '';
        this.observationDialogVisible = true;
    }

    saveObservation(): void {
        if (!this.eventId || !this.observationText.trim()) return;
        this.actionLoading = true;
        this.eventService.addObservation(this.eventId, this.observationText).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Observation enregistrée', detail: 'L\'observation a été sauvegardée.', life: 4000 });
                this.observationDialogVisible = false; this.actionLoading = false; this.loadEvent();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible d\'enregistrer l\'observation' });
                this.actionLoading = false;
            }
        });
    }

    openDelegateDialog(): void {
        this.delegueNom   = this.event?.delegueNom   || '';
        this.delegueEmail = this.event?.delegueEmail || '';
        this.delegueMotif = this.event?.delegueMotif || '';
        this.delegateDialogVisible = true;
    }

    delegateParticipation(): void {
        if (!this.eventId || !this.delegueNom.trim() || !this.delegueEmail.trim()) return;
        this.actionLoading = true;
        this.eventService.delegateParticipation(this.eventId, this.delegueNom, this.delegueEmail, this.delegueMotif).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Délégation enregistrée', detail: `${this.delegueNom} désigné(e) comme délégué(e).`, life: 4000 });
                this.delegateDialogVisible = false; this.actionLoading = false; this.loadEvent();
            },
            error: (err: any) => {
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: err.error?.message || 'Impossible d\'enregistrer la délégation' });
                this.actionLoading = false;
            }
        });
    }

    // ==========================================
    // FICHIERS
    // ==========================================
    openFilePreview(file: FileUpload): void {
        this.selectedFile = file;
        this.fileService.downloadFile(file.id!).subscribe({
            next: (blob: Blob) => {
                const url = URL.createObjectURL(blob);
                this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                this.filePreviewVisible = true;
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'afficher le fichier', life: 3000 })
        });
    }

    closePreview(): void {
        this.filePreviewVisible = false;
        if (this.filePreviewUrl) {
            const url = this.filePreviewUrl.changingThisBreaksApplicationSecurity;
            if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        }
        this.selectedFile = undefined; this.filePreviewUrl = null;
    }

    downloadFileOnly(file: FileUpload): void {
        if (!file.id) return;
        this.fileService.downloadFile(file.id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href = url; a.download = file.fileName;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Fichier téléchargé', life: 2000 });
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement', life: 3000 })
        });
    }

    onFileUpload(event: any): void {
        if (!this.eventId) return;
        const files = event.files; let uploadedCount = 0;
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file); formData.append('eventId', this.eventId);
            this.fileService.uploadFile(formData).subscribe({
                next: () => {
                    uploadedCount++;
                    if (uploadedCount === files.length) {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `${uploadedCount} fichier(s) ajouté(s)`, life: 3000 });
                        this.loadFiles();
                    }
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: `Échec d'upload de ${file.name}`, life: 3000 })
            });
        }
    }

    confirmDeleteFile(file: FileUpload): void {
        this.confirmationService.confirm({
            message: `Supprimer le fichier "${file.fileName}" ?`,
            header: 'Confirmation', icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui', rejectLabel: 'Non', acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteFile(file.id!)
        });
    }

    deleteFile(fileId: string): void {
        this.fileService.deleteFile(fileId).subscribe({
            next: () => { this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Fichier supprimé', life: 2000 }); this.loadFiles(); },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression', life: 3000 })
        });
    }

    downloadAttendance(): void {
        if (!this.eventId) return;
        this.eventService.generateAttendanceSheet(this.eventId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href = url; a.download = `liste_emargement_${this.eventId}.pdf`;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du téléchargement', life: 3000 })
        });
    }

    triggerFileUpload(): void { this.hiddenFileInput?.nativeElement?.click(); }

    onHiddenFileChange(event: any): void {
        if (!this.eventId) return;
        const files = event.target.files; let uploaded = 0;
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file); formData.append('eventId', this.eventId);
            this.fileService.uploadFile(formData).subscribe({
                next: () => {
                    uploaded++;
                    if (uploaded === files.length) {
                        this.messageService.add({ severity: 'success', summary: 'Succès', detail: uploaded + ' fichier(s) ajouté(s)', life: 3000 });
                        this.loadFiles();
                    }
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec upload' })
            });
        }
        event.target.value = '';
    }

    // ==========================================
    // HELPERS
    // ==========================================
    isImage(fileName: string | undefined): boolean {
        if (!fileName) return false;
        return ['jpg','jpeg','png','gif','webp','bmp'].includes(fileName.split('.').pop()?.toLowerCase() || '');
    }

    isPDF(fileName: string | undefined): boolean {
        return !!fileName?.toLowerCase().endsWith('.pdf');
    }

    getFileUrl(fileId: string): string {
        return `http://localhost:8081/api/v1/cge-agenda/file/download/${fileId}`;
    }

    getFileIcon(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const icons: Record<string, string> = {
            'pdf': 'pi pi-file-pdf text-red-500', 'doc': 'pi pi-file-word text-blue-500',
            'docx': 'pi pi-file-word text-blue-500', 'xls': 'pi pi-file-excel text-green-500',
            'xlsx': 'pi pi-file-excel text-green-500'
        };
        return icons[ext || ''] || 'pi pi-file text-gray-500';
    }

    formatFileSize(bytes: number | undefined): string {
        if (!bytes) return '0 B';
        const k = 1024, sizes = ['B','KB','MB','GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    calculateDuration(): number {
        if (!this.event) return 0;
        const diff = Math.abs(new Date(this.event.endDate).getTime() - new Date(this.event.startDate).getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }

    getTypeLabel(type: string):        string     { return EventTypeLabels[type]    || type; }
    getStatusLabel(status: string):    string     { return EventStatusLabels[status] || status; }
    getTypeSeverity(type: string):     TagSeverity { return getEventTypeSeverity(type); }
    getStatusSeverity(status: string): TagSeverity { return getEventStatusSeverity(status); }

    getEventTypeColor(): string {
        const colors: Record<string, string> = {
            CONFERENCE: '#1565C0', SEMINAIRE: '#6A1B9A', ATELIER: '#E65100',
            REUNION: '#228B22', CEREMONIE: '#F57F17', FORMATION: '#00695C', AUTRE: '#546E7A'
        };
        return colors[this.event?.type || ''] || '#228B22';
    }

    getEventTypeIcon(): string {
        const icons: Record<string, string> = {
            CONFERENCE: 'pi-microphone', SEMINAIRE: 'pi-book', ATELIER: 'pi-wrench',
            REUNION: 'pi-users', CEREMONIE: 'pi-star', FORMATION: 'pi-graduation-cap', AUTRE: 'pi-calendar'
        };
        return icons[this.event?.type || ''] || 'pi-calendar';
    }

    get heroGradient(): string {
        const gradients: Record<string, string> = {
            CONFERENCE:    'linear-gradient(135deg, #0d3b8c 0%, #1565C0 55%, #1e88e5 100%)',
            SEMINAIRE:     'linear-gradient(135deg, #4a0072 0%, #6A1B9A 55%, #9c27b0 100%)',
            ATELIER:       'linear-gradient(135deg, #bf360c 0%, #E65100 55%, #f4511e 100%)',
            REUNION:       'linear-gradient(135deg, #145214 0%, #228B22 55%, #2e9e2e 100%)',
            CEREMONIE:     'linear-gradient(135deg, #b34700 0%, #E65100 50%, #F57F17 100%)',
            FORMATION:     'linear-gradient(135deg, #004d40 0%, #00695C 55%, #00897b 100%)',
            AUTRE:         'linear-gradient(135deg, #263238 0%, #546E7A 55%, #78909c 100%)',
        };
        return gradients[this.event?.type || ''] || 'linear-gradient(135deg, #145214 0%, #228B22 55%, #2e9e2e 100%)';
    }

    getDelegueInitials(): string {
        const parts = (this.event?.delegueNom || '').split(' ');
        return this.getInitials(parts[0] ?? '', parts[1] ?? '');
    }

    getInitials(first: string, last: string): string {
        return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
    }

    getAvatarColor(seed: string): string {
        const colors = ['#1565C0','#6A1B9A','#E65100','#228B22','#F57F17','#00695C','#546E7A','#c62828','#00838f'];
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    editEvent(): void { if (this.eventId) this.router.navigate(['/events', this.eventId, 'edit']); }
    goBack():    void { this.router.navigate(['/events']); }
}
