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
                                  size="small" pTooltip="Ajouter des fichiers"
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
                                          (onClick)="openFilePreview(file)"></p-button>
                                <p-button icon="pi pi-download" [rounded]="true" [text]="true"
                                          severity="secondary" size="small"
                                          (onClick)="downloadFileOnly(file)"></p-button>
                                <p-button *ngIf="!isEnAttente" icon="pi pi-trash"
                                          [rounded]="true" [text]="true" severity="danger"
                                          size="small"
                                          (onClick)="confirmDeleteFile(file)"></p-button>
                            </div>
                        </div>
                    </div>

                    <div *ngIf="!loadingFiles && files.length === 0" class="ed-empty">
                        <i class="pi pi-inbox"></i>
                        <p>Aucun fichier joint</p>
                        <p-button *ngIf="!isEnAttente" label="Ajouter" icon="pi pi-upload"
                                  size="small" severity="success"
                                  (onClick)="triggerFileUpload()"></p-button>
                    </div>
                </div>

            </div>
        </div>

    </ng-container>
</div>
    `,
    styles: [`
        /* ================================================
           PAGE
           ================================================ */
        .ed-page { padding: 0; }

        /* ================================================
           HERO
           ================================================ */
        .ed-hero {
            border-radius: 20px;
            padding: 28px 32px 32px;
            color: white;
            margin-bottom: 20px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.22);
        }

        /* Cercles décoratifs */
        .ed-hero::before {
            content: '';
            position: absolute;
            top: -80px; right: -80px;
            width: 320px; height: 320px;
            background: rgba(255,255,255,0.07);
            border-radius: 50%;
            pointer-events: none;
        }

        .ed-hero::after {
            content: '';
            position: absolute;
            bottom: -50px; left: 30%;
            width: 180px; height: 180px;
            background: rgba(255,255,255,0.05);
            border-radius: 50%;
            pointer-events: none;
        }

        .ed-hero-skeleton {
            height: 200px; border-radius: 16px;
            background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
            background-size: 400% 100%;
            animation: shimmer 1.4s infinite;
            margin-bottom: 16px;
        }
        @keyframes shimmer { 0%{background-position:100% 0} 100%{background-position:-100% 0} }

        .ed-back-btn {
            display: inline-flex; align-items: center; gap: 7px;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.45);
            color: white; border-radius: 10px;
            padding: 7px 16px; font-size: 13px; font-weight: 600;
            cursor: pointer; transition: all .2s;
            margin-bottom: 22px;
            backdrop-filter: blur(6px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .ed-back-btn:hover {
            background: rgba(255,255,255,0.32);
            transform: translateX(-2px);
        }

        .ed-hero-inner {
            display: flex; align-items: flex-start;
            justify-content: space-between; gap: 24px; flex-wrap: wrap;
        }

        .ed-hero-left { display: flex; gap: 20px; align-items: flex-start; flex: 1; min-width: 0; }

        .ed-hero-sep {
            width: 1px;
            align-self: stretch;
            background: rgba(255,255,255,0.2);
            flex-shrink: 0;
            margin: 0 4px;
        }

        @media (max-width: 1100px) { .ed-hero-sep { display: none; } }

        .ed-hero-type-icon {
            width: 68px; height: 68px; border-radius: 18px;
            background: rgba(255,255,255,0.22);
            border: 2px solid rgba(255,255,255,0.4);
            display: flex; align-items: center; justify-content: center;
            font-size: 30px; flex-shrink: 0;
            box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        }

        .ed-hero-type-label {
            font-size: 11px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1.2px;
            color: rgba(255,255,255,0.85);
            margin-bottom: 6px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .ed-hero-title {
            margin: 0 0 14px; font-size: 28px; font-weight: 800;
            line-height: 1.2; color: #ffffff;
            text-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }

        .ed-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

        /* Badges dans la bannière */
        .ed-badge {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 5px 13px; border-radius: 20px;
            font-size: 12px; font-weight: 700;
            backdrop-filter: blur(4px);
        }
        .ed-badge-lock    { background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.5); color: white; }
        .ed-badge-pending { background: rgba(255,152,0,0.35);   border: 1px solid rgba(255,200,50,0.5); color: #fff3cd; }
        .ed-badge-draft   { background: rgba(200,210,220,0.3);  border: 1px solid rgba(200,210,220,0.45); color: white; }
        .ed-badge-warn    { background: rgba(239,68,68,0.35);   border: 1px solid rgba(239,68,68,0.5); color: #ffe0e0; }
        .ed-badge-delegue { background: rgba(167,139,250,0.35); border: 1px solid rgba(167,139,250,0.5); color: #ede9fe; }

        /* Méta-infos droite */
        .ed-hero-meta {
            display: flex; flex-direction: column; gap: 10px;
            flex-shrink: 0;
        }

        .ed-meta-chip {
            display: flex; align-items: center; gap: 12px;
            background: rgba(255,255,255,0.18);
            border: 1px solid rgba(255,255,255,0.35);
            border-radius: 12px; padding: 10px 16px; min-width: 190px;
            backdrop-filter: blur(8px);
            transition: background 0.2s;
        }
        .ed-meta-chip:hover { background: rgba(255,255,255,0.26); }

        .ed-meta-chip i { font-size: 17px; flex-shrink: 0; color: rgba(255,255,255,0.85); }

        .ed-meta-chip div { display: flex; flex-direction: column; gap: 1px; }

        .meta-lbl {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: .7px; color: rgba(255,255,255,0.65);
        }
        .meta-val { font-size: 14px; font-weight: 700; color: #ffffff; }

        /* ================================================
           BARRE D'ACTIONS
           ================================================ */
        .ed-actions-bar {
            display: flex; align-items: center; justify-content: space-between;
            background: var(--surface-card);
            padding: 12px 20px; border-radius: 14px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.07);
            border: 1px solid var(--surface-border);
            margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
        }

        .ed-actions-right { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ================================================
           ALERTES
           ================================================ */
        .ed-alert {
            display: flex; align-items: flex-start; gap: 14px;
            border-radius: 12px; padding: 16px 20px;
            margin-bottom: 16px;
        }

        .ed-alert-warn {
            background: #fff8e1; border: 1px solid #ffe082;
            border-left: 4px solid #ff9800;
        }
        .ed-alert-warn .ed-alert-icon { color: #f57f17; }
        .ed-alert-warn strong { color: #e65100; }
        .ed-alert-warn p { color: #555; font-size: 14px; margin: 4px 0 0; }

        .ed-alert-danger {
            background: #ffebee; border: 1px solid #ef9a9a;
            border-left: 4px solid #f44336;
        }
        .ed-alert-danger .ed-alert-icon { color: #c62828; }
        .ed-alert-danger strong { color: #c62828; }
        .ed-alert-danger p { color: #555; font-size: 14px; margin: 4px 0 0; }

        .ed-alert-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .ed-alert-hint { font-size: 12px; color: #7c5d00; margin-top: 6px !important; }

        /* ================================================
           GRILLE PRINCIPALE
           ================================================ */
        .ed-grid {
            display: grid;
            grid-template-columns: 1fr 360px;
            gap: 20px;
            align-items: start;
        }

        @media (max-width: 1100px) {
            .ed-grid { grid-template-columns: 1fr; }
            .ed-col-right { order: -1; }
            .ed-hero-meta { display: none; }
            .ed-hero-title { font-size: 20px; }
        }

        /* ================================================
           CARTES
           ================================================ */
        .ed-card {
            background: var(--surface-card);
            border-radius: 14px;
            padding: 20px 22px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            margin-bottom: 16px;
        }

        .ed-card-obs     { border-left: 4px solid #1976D2; }
        .ed-card-delegue { border-left: 4px solid #7c3aed; }

        /* Section header */
        .ed-section-hd {
            display: flex; align-items: center; gap: 12px;
            margin-bottom: 16px;
        }

        .ed-section-icon {
            width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; flex-shrink: 0;
        }

        .ed-section-hd h3 {
            margin: 0; font-size: 16px; font-weight: 700;
            color: var(--text-color); flex: 1;
        }

        .ed-badge-count {
            background: #e8f5e9; color: #228B22;
            font-size: 12px; font-weight: 700;
            padding: 2px 10px; border-radius: 20px;
        }

        /* ================================================
           DESCRIPTION
           ================================================ */
        .ed-description {
            color: var(--text-color-secondary);
            line-height: 1.7; font-size: 14px; margin: 0;
        }

        /* ================================================
           HORAIRES
           ================================================ */
        .ed-schedules { display: flex; flex-direction: column; gap: 10px; }

        .ed-schedule-item {
            background: var(--surface-ground);
            border-radius: 10px; padding: 12px 14px;
            display: flex; flex-direction: column; gap: 6px;
        }

        .ed-schedule-date,
        .ed-schedule-time,
        .ed-schedule-addr {
            display: flex; align-items: center; gap: 8px; font-size: 13px;
        }

        .ed-schedule-date { font-weight: 700; color: var(--text-color); }
        .ed-schedule-time { color: #1976D2; font-weight: 600; }
        .ed-schedule-addr { color: var(--text-color-secondary); }

        .ed-schedules-toggle { text-align: center; margin-top: 6px; }

        /* ================================================
           LIEU
           ================================================ */
        .ed-info-row {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 0; font-size: 14px;
            border-bottom: 1px solid var(--surface-border);
        }
        .ed-info-row:last-child { border-bottom: none; }
        .ed-row-icon { font-size: 15px; color: #ff9800; flex-shrink: 0; }

        .ed-visio-link {
            display: inline-flex; align-items: center; gap: 6px;
            color: #7b1fa2; text-decoration: none; font-weight: 600; font-size: 14px;
            padding: 4px 10px; background: #f3e5f5; border-radius: 8px; transition: all .15s;
        }
        .ed-visio-link:hover { background: #9c27b0; color: white; }

        /* ================================================
           PARTICIPANTS
           ================================================ */
        .ed-participants { display: flex; flex-direction: column; gap: 10px; }

        .ed-participant {
            display: flex; align-items: center; gap: 14px;
            padding: 12px 14px;
            background: var(--surface-ground);
            border-radius: 10px;
            transition: background .15s;
        }
        .ed-participant:hover { background: #e8f5e9; }

        .ed-avatar {
            width: 42px; height: 42px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 15px; font-weight: 800;
            flex-shrink: 0;
        }

        .ed-avatar-sm { width: 36px; height: 36px; font-size: 13px; }

        .ed-participant-name {
            font-size: 14px; font-weight: 700; color: var(--text-color);
            margin-bottom: 4px;
        }

        .ed-participant-meta {
            display: flex; flex-wrap: wrap; gap: 10px;
        }

        .ed-participant-meta span {
            display: flex; align-items: center; gap: 4px;
            font-size: 12px; color: var(--text-color-secondary);
        }

        /* ================================================
           MINI STATS
           ================================================ */
        .ed-stats-row {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 10px; margin-bottom: 16px;
        }

        .ed-stat-mini {
            display: flex; flex-direction: column; align-items: center;
            background: var(--surface-card);
            border-radius: 12px; padding: 14px 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            gap: 4px;
        }

        .ed-stat-mini i { font-size: 20px; margin-bottom: 4px; }
        .ed-stat-num  { font-size: 22px; font-weight: 800; color: var(--text-color); }
        .ed-stat-lbl  { font-size: 11px; color: var(--text-color-secondary); text-align: center; }

        /* ================================================
           OBSERVATION
           ================================================ */
        .ed-observation {
            margin: 0; padding: 12px 16px;
            background: #f0f7ff; border-radius: 8px;
            border-left: 3px solid #1976D2;
            font-style: italic; font-size: 14px;
            color: var(--text-color); line-height: 1.7;
        }

        /* ================================================
           DÉLÉGATION
           ================================================ */
        .ed-delegue-row {
            display: flex; align-items: flex-start; gap: 12px;
        }

        .ed-delegue-name  { font-weight: 700; font-size: 14px; color: var(--text-color); }
        .ed-delegue-email { font-size: 13px; color: var(--text-color-secondary); margin-top: 2px; }
        .ed-delegue-motif { font-size: 12px; color: #888; font-style: italic; margin-top: 4px; }

        /* ================================================
           FICHIERS
           ================================================ */
        .ed-files { display: flex; flex-direction: column; gap: 8px; }

        .ed-file-item {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px;
            background: var(--surface-ground);
            border-radius: 10px; transition: background .15s;
        }
        .ed-file-item:hover { background: #e8f5e9; }

        .ed-file-thumb {
            width: 38px; height: 38px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            background: white; overflow: hidden; flex-shrink: 0; cursor: pointer;
            font-size: 18px;
        }

        .ed-file-img { width: 100%; height: 100%; object-fit: cover; }

        .ed-file-info {
            flex: 1; min-width: 0; display: flex; flex-direction: column;
            gap: 2px; cursor: pointer;
        }

        .ed-file-name {
            font-size: 13px; font-weight: 600; color: var(--text-color);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .ed-file-size { font-size: 11px; color: var(--text-color-secondary); }

        .ed-file-btns { display: flex; gap: 2px; flex-shrink: 0; }

        /* ================================================
           ÉTATS VIDE / ERREUR
           ================================================ */
        .ed-empty {
            text-align: center; padding: 30px 16px;
            color: var(--text-color-secondary);
        }
        .ed-empty i { font-size: 32px; display: block; margin-bottom: 8px; }
        .ed-empty p { margin: 0 0 12px; font-size: 14px; }

        .ed-error {
            text-align: center; padding: 80px 20px;
        }
        .ed-error-icon {
            width: 80px; height: 80px; border-radius: 50%;
            background: #ffebee; color: #c62828;
            display: flex; align-items: center; justify-content: center;
            font-size: 36px; margin: 0 auto 16px;
        }
        .ed-error h3 { margin: 0 0 8px; font-size: 20px; }
        .ed-error p  { color: var(--text-color-secondary); margin-bottom: 20px; }

        .ed-loading-files { text-align: center; padding: 20px; color: var(--text-color-secondary); }
        .ed-loading-files i { font-size: 24px; }

        /* ================================================
           DIALOGS
           ================================================ */
        .dlg-body { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }

        .dlg-banner {
            display: flex; align-items: flex-start; gap: 10px;
            padding: 12px 16px; border-radius: 10px;
            font-size: 14px;
        }
        .dlg-banner i { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .dlg-banner div { display: flex; flex-direction: column; gap: 2px; }
        .dlg-banner small { font-size: 12px; opacity: .8; }

        .dlg-green  { background: #e8f5e9; color: #2e7d32; border-left: 4px solid #4caf50; }
        .dlg-orange { background: #fff3e0; color: #e65100; border-left: 4px solid #ff9800; }
        .dlg-red    { background: #ffebee; color: #c62828; border-left: 4px solid #f44336; }
        .dlg-purple { background: #f3e5f5; color: #6a1b9a; border-left: 4px solid #9c27b0; }
        .dlg-blue   { background: #e3f2fd; color: #0d47a1; border-left: 4px solid #1976D2; }

        .dlg-label { font-weight: 600; font-size: 14px; color: var(--text-color); }
        .dlg-opt   { font-weight: 400; font-size: 13px; color: var(--text-color-secondary); }

        .dlg-info {
            display: flex; align-items: flex-start; gap: 8px;
            padding: 10px 14px; background: #e3f2fd;
            border-radius: 8px; color: #1565c0; font-size: 13px;
        }
        .dlg-info-orange { background: #fff3e0; color: #e65100; }

        .dlg-alert-reject {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 14px; background: #ffebee;
            border-radius: 8px; color: #c62828; font-size: 13px; font-weight: 600;
        }

        .dlg-field { margin-bottom: 4px; display: flex; flex-direction: column; gap: 6px; }

        /* ================================================
           FILE PREVIEW DIALOG
           ================================================ */
        .preview-container {
            display: flex; align-items: center; justify-content: center;
            min-height: 60vh; background: var(--surface-ground);
            padding: 1rem; border-radius: 8px;
        }
        .preview-image { max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px; }
        .preview-iframe { width: 100%; height: 70vh; border: none; border-radius: 8px; }
        .no-preview { text-align: center; padding: 3rem; color: var(--text-color-secondary); }
        .no-preview i { font-size: 5rem; display: block; margin-bottom: 1rem; }

        :host ::ng-deep {
            .p-dialog .p-dialog-content { padding: 16px 24px !important; }
        }
    `]
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
