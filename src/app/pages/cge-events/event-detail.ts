import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';

// Services & Models
import { EventService } from '../../service/event.service';
import { FileService } from '../../service/file.service';
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
        CommonModule,
        CardModule,
        ButtonModule,
        TagModule,
        DividerModule,
        ToastModule,
        ConfirmDialogModule,
        TooltipModule,
        FileUploadModule,
        DialogModule,
        ImageModule,
        SkeletonModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <!-- File Preview Dialog -->
        <p-dialog 
            [(visible)]="filePreviewVisible" 
            [modal]="true" 
            [style]="{width: '90vw', maxWidth: '1200px'}"
            [header]="selectedFile?.fileName"
            [draggable]="false"
            [resizable]="false"
            (onHide)="closePreview()">
            <div class="preview-container">
                <!-- Image Preview -->
                <img *ngIf="isImage(selectedFile?.fileName)" 
                     [src]="filePreviewUrl" 
                     [alt]="selectedFile?.fileName"
                     class="preview-image">
                
                <!-- PDF Preview -->
                <iframe *ngIf="isPDF(selectedFile?.fileName)"
                        [src]="filePreviewUrl"
                        class="preview-iframe">
                </iframe>
                
                <!-- No Preview Available -->
                <div *ngIf="!isImage(selectedFile?.fileName) && !isPDF(selectedFile?.fileName)"
                     class="no-preview">
                    <i class="pi pi-file"></i>
                    <p>Prévisualisation non disponible pour ce type de fichier</p>
                    <p-button 
                        label="Télécharger le fichier" 
                        icon="pi pi-download"
                        severity="help"
                        (onClick)="downloadFileOnly(selectedFile!)">
                    </p-button>
                </div>
            </div>
            
            <ng-template pTemplate="footer">
                <p-button 
                    label="Télécharger" 
                    icon="pi pi-download" 
                    [outlined]="true"
                    (onClick)="downloadFileOnly(selectedFile!)">
                </p-button>
                <p-button 
                    label="Fermer" 
                    icon="pi pi-times" 
                    severity="secondary"
                    (onClick)="closePreview()">
                </p-button>
            </ng-template>
        </p-dialog>

        <div class="event-detail-container">
            <!-- Loading State -->
            <div *ngIf="loading" class="loading-state">
                <div class="card">
                    <p-skeleton height="3rem" styleClass="mb-3"></p-skeleton>
                    <p-skeleton height="2rem" styleClass="mb-3"></p-skeleton>
                    <p-skeleton height="10rem"></p-skeleton>
                </div>
            </div>

            <!-- Content -->
            <ng-container *ngIf="!loading && event">
                
                <!-- Header -->
                <div class="detail-header">
                    <p-button 
                        label="Retour" 
                        icon="pi pi-arrow-left" 
                        [text]="true"
                        severity="secondary"
                        (onClick)="goBack()">
                    </p-button>
                    <div class="header-actions">
    <p-button
        *ngIf="event?.status !== 'ANNULER' && event?.status !== 'TERMINE'"
        label="Modifier"
        icon="pi pi-pencil"
        [outlined]="true"
        (onClick)="editEvent()">
    </p-button>

    <p-button
        label="Liste émargement"
        icon="pi pi-download"
        severity="help"
        (onClick)="downloadAttendance()">
    </p-button>
</div>
                </div>

                <div class="detail-content">
                    <!-- Left Column -->
                    <div class="left-column">
                        
                        <!-- Title Card -->
                        <div class="card title-card">
                            <h1 class="event-title">{{ event.title }}</h1>
                            <div class="tags-row">
                                <p-tag 
                                    [value]="getTypeLabel(event.type)" 
                                    [severity]="getTypeSeverity(event.type)"
                                    [rounded]="true">
                                </p-tag>
                                <p-tag 
                                    [value]="getStatusLabel(event.status)" 
                                    [severity]="getStatusSeverity(event.status)"
                                    [rounded]="true">
                                </p-tag>

                                <span
        *ngIf="event?.status === 'ANNULER' || event?.status === 'TERMINE'"
        style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(255,255,255,0.4);
        ">
        <i class="pi pi-lock"></i>
        Lecture seule
    </span>
                            </div>
                        </div>

                        <!-- Description -->
                        <div class="card" *ngIf="event.description">
                            <div class="section-header">
                                <i class="pi pi-align-left"></i>
                                <h3>Description</h3>
                            </div>
                            <p class="description-text">{{ event.description }}</p>
                        </div>

                        <!-- Dates -->
                        <div class="card">
                            <div class="section-header">
                                <i class="pi pi-calendar"></i>
                                <h3>Période</h3>
                            </div>
                            <div class="dates-grid">
                                <div class="date-box">
                                    <span class="date-label">Date de début</span>
                                    <span class="date-value">{{ event.startDate | date:'dd/MM/yyyy' }}</span>
                                </div>
                                <div class="date-box">
                                    <span class="date-label">Date de fin</span>
                                    <span class="date-value">{{ event.endDate | date:'dd/MM/yyyy' }}</span>
                                </div>
                            </div>
                            <div class="duration-box">
                                <i class="pi pi-clock"></i>
                                <span>Durée : <strong>{{ calculateDuration() }} jour(s)</strong></span>
                            </div>
                        </div>

                        <!-- Location -->
                        <div class="card" *ngIf="event.ville || event.pays || event.meetingLink">
                            <div class="section-header">
                                <i class="pi pi-map-marker"></i>
                                <h3>Lieu</h3>
                            </div>
                            <div class="info-row" *ngIf="event.ville || event.pays">
                                <i class="pi pi-map-marker icon-orange"></i>
                                <span>{{ event.ville }}{{ event.ville && event.pays ? ', ' : '' }}{{ event.pays }}</span>
                            </div>
                            <div class="info-row" *ngIf="event.meetingLink">
                                <i class="pi pi-video icon-cyan"></i>
                                <a [href]="event.meetingLink" target="_blank" class="link-primary">
                                    Rejoindre la visioconférence
                                </a>
                            </div>
                        </div>

                        <!-- Schedules -->
                        <div class="card" *ngIf="event.schedules && event.schedules.length > 0">
                            <div class="section-header">
                                <i class="pi pi-clock"></i>
                                <h3>Horaires</h3>
                                <span class="badge-count">{{ event.schedules.length }}</span>
                            </div>
                            <div class="schedules-list">
                                <div *ngFor="let schedule of event.schedules" class="schedule-item">
                                    <div class="schedule-date">
                                        <i class="pi pi-calendar"></i>
                                        <span>{{ schedule.dateJour | date:'dd/MM/yyyy' }}</span>
                                    </div>
                                    <div class="schedule-time">
                                        <i class="pi pi-clock"></i>
                                        <span>{{ schedule.startTime }} - {{ schedule.endTime }}</span>
                                    </div>
                                    <div class="schedule-address" *ngIf="schedule.address">
                                        <i class="pi pi-map-marker"></i>
                                        <span>{{ schedule.address }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Participants -->
                        <div class="card">
                            <div class="section-header">
                                <i class="pi pi-users"></i>
                                <h3>Participants</h3>
                                <span class="badge-count">{{ event.participants?.length || 0 }}</span>
                            </div>
                            <div *ngIf="event.participants && event.participants.length > 0" class="participants-grid">
                                <div *ngFor="let participant of event.participants" class="participant-card">
                                    <div class="participant-avatar">
                                        <i class="pi pi-user"></i>
                                    </div>
                                    <div class="participant-info">
                                        <h4>{{ participant.firstName }} {{ participant.lastName }}</h4>
                                        <div class="participant-detail">
                                            <i class="pi pi-envelope"></i>
                                            <span>{{ participant.email }}</span>
                                        </div>
                                        <div class="participant-detail" *ngIf="participant.phoneNumber">
                                            <i class="pi pi-phone"></i>
                                            <span>{{ participant.phoneNumber }}</span>
                                        </div>
                                        <div class="participant-detail" *ngIf="participant?.structure">
                                     <i class="pi pi-building"></i>
                                            <span>{{ participant.structure }}</span>
                                            </div>
                                    </div>
                                </div>
                            </div>
                            <div *ngIf="!event.participants || event.participants.length === 0" class="empty-state">
                                <i class="pi pi-users"></i>
                                <p>Aucun participant enregistré</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column -->
                    <div class="right-column">
                        
                        <!-- Stats Card -->
                        <div class="card stats-card">
                            <h3>Statistiques</h3>
                            <div class="stat-item">
                                <div class="stat-icon stat-primary">
                                    <i class="pi pi-users"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Participants</span>
                                    <span class="stat-value">{{ event.participants?.length || 0 }}</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon stat-success">
                                    <i class="pi pi-paperclip"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Fichiers</span>
                                    <span class="stat-value">{{ files.length }}</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon stat-warning">
                                    <i class="pi pi-calendar"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-label">Durée</span>
                                    <span class="stat-value">{{ calculateDuration() }}j</span>
                                </div>
                            </div>
                        </div>

                        <!-- Files Card -->
                        <div class="card files-card">
                            <div class="section-header">
                                <div class="header-left">
                                    <i class="pi pi-paperclip"></i>
                                    <h3>Fichiers</h3>
                                    <span class="badge-count">{{ files.length }}</span>
                                </div>
                                
                            </div>

                            <p-fileupload 
                                #fileUpload
                                mode="basic" 
                                [multiple]="true"
                                [maxFileSize]="10000000"
                                [auto]="false"
                                [customUpload]="true"
                                (uploadHandler)="onFileUpload($event)"
                                [style]="{'display': 'none'}">
                            </p-fileupload>

                            <div *ngIf="loadingFiles" class="loading-files">
                                <i class="pi pi-spin pi-spinner"></i>
                            </div>

                            <div *ngIf="!loadingFiles && files.length > 0" class="files-list">
                                <div *ngFor="let file of files" class="file-item">
                                    <!-- Thumbnail/Icon - Cliquable -->
                                    <div class="file-preview" (click)="openFilePreview(file)">
                                        <img *ngIf="isImage(file.fileName)" 
                                             [src]="getFileUrl(file.id!)" 
                                             [alt]="file.fileName"
                                             class="file-thumbnail">
                                        <i *ngIf="!isImage(file.fileName)" 
                                           [class]="getFileIcon(file.fileName)"></i>
                                    </div>
                                    
                                    <!-- File Info - Cliquable -->
                                    <div class="file-info" (click)="openFilePreview(file)">
                                        <span class="file-name" [title]="file.fileName">{{ file.fileName }}</span>
                                        <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
                                    </div>
                                    
                                    <!-- Action Buttons -->
                                    <div class="file-actions">
                                        <p-button 
                                            icon="pi pi-eye" 
                                            [rounded]="true"
                                            [outlined]="true"
                                            severity="secondary"
                                            size="small"
                                            pTooltip="Visualiser"
                                            (onClick)="openFilePreview(file)">
                                        </p-button>
                                        <p-button 
                                            icon="pi pi-download" 
                                            [rounded]="true"
                                            [outlined]="true"
                                            severity="secondary"
                                            size="small"
                                            pTooltip="Télécharger"
                                            (onClick)="downloadFileOnly(file)">
                                        </p-button>
                                        <p-button 
                                            icon="pi pi-trash" 
                                            [rounded]="true"
                                            [outlined]="true"
                                            severity="danger"
                                            size="small"
                                            pTooltip="Supprimer"
                                            (onClick)="confirmDeleteFile(file)">
                                        </p-button>
                                    </div>
                                </div>
                            </div>

                            <div *ngIf="!loadingFiles && files.length === 0" class="empty-state">
                                <i class="pi pi-inbox"></i>
                                <p>Aucun fichier</p>
                                <p-button 
                                    label="Ajouter" 
                                    icon="pi pi-upload" 
                                    size="small"
                                    (onClick)="fileUpload.choose()">
                                </p-button>
                            </div>
                        </div>
                    </div>
                </div>

            </ng-container>

            <!-- Error State -->
            <div *ngIf="!loading && !event" class="error-state">
                <i class="pi pi-exclamation-triangle"></i>
                <h3>Événement introuvable</h3>
                <p>L'événement demandé n'existe pas ou a été supprimé</p>
                <p-button 
                    label="Retour à la liste" 
                    icon="pi pi-arrow-left" 
                    (onClick)="goBack()">
                </p-button>
            </div>
        </div>
    `,
    styles: [`
        .event-detail-container {
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        .header-actions {
            display: flex;
            gap: 0.75rem;
        }

        .detail-content {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 2rem;
        }

        @media (max-width: 1024px) {
            .detail-content {
                grid-template-columns: 1fr;
            }
            
            .right-column {
                order: -1;
            }
        }

        /* Cards */
        .card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 1.5rem;
        }

        .title-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .event-title {
            font-size: 2rem;
            font-weight: 700;
            margin: 0 0 1rem 0;
        }

        .tags-row {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        /* Section Header */
        .section-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1.25rem;
        }

        .section-header i {
            font-size: 1.25rem;
            color: var(--primary-color);
        }

        .section-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
            flex: 1;
        }

        .section-header .header-left {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
        }

        .badge-count {
            background: var(--primary-color);
            color: white;
            font-size: 0.875rem;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
        }

        /* Description */
        .description-text {
            color: #666;
            line-height: 1.6;
            margin: 0;
        }

        /* Dates */
        .dates-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .date-box {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .date-label {
            font-size: 0.875rem;
            color: #666;
        }

        .date-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #333;
        }

        .duration-box {
            background: #e3f2fd;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #1976d2;
        }

        /* Info Row */
        .info-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 0;
        }

        .info-row:not(:last-child) {
            border-bottom: 1px solid #f0f0f0;
        }

        .info-row i {
            font-size: 1.125rem;
        }

        .icon-orange { color: #ff9800; }
        .icon-cyan { color: #00bcd4; }

        .link-primary {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 500;
        }

        .link-primary:hover {
            text-decoration: underline;
        }

        /* Schedules */
        .schedules-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .schedule-item {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .schedule-date,
        .schedule-time,
        .schedule-address {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9375rem;
        }

        .schedule-date {
            font-weight: 600;
            color: #333;
        }

        .schedule-time,
        .schedule-address {
            color: #666;
        }

        /* Participants */
        .participants-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
        }

        .participant-card {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            gap: 1rem;
            transition: all 0.2s;
        }

        .participant-card:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }

        .participant-avatar {
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .participant-avatar i {
            font-size: 1.5rem;
        }

        .participant-info {
            flex: 1;
            min-width: 0;
        }

        .participant-info h4 {
            font-size: 1rem;
            font-weight: 600;
            margin: 0 0 0.5rem 0;
            color: #333;
        }

        .participant-detail {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #666;
            margin-bottom: 0.25rem;
        }

        .participant-detail i {
            font-size: 0.875rem;
        }

        /* Stats Card */
        .stats-card h3 {
            font-size: 1.125rem;
            font-weight: 600;
            margin: 0 0 1.5rem 0;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 0.75rem;
        }

        .stat-icon {
            width: 3rem;
            height: 3rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .stat-icon i {
            font-size: 1.5rem;
        }

        .stat-primary { background: #667eea; }
        .stat-success { background: #22c55e; }
        .stat-warning { background: #f59e0b; }

        .stat-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .stat-label {
            font-size: 0.875rem;
            color: #666;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
        }

        /* Files */
        .files-card {
            position: sticky;
            top: 2rem;
        }

        .files-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .file-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .file-item:hover {
            background: #e9ecef;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .file-preview {
            width: 3rem;
            height: 3rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            overflow: hidden;
            flex-shrink: 0;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .file-preview:hover {
            transform: scale(1.1);
        }

        .file-thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .file-preview i {
            font-size: 1.5rem;
        }

        .file-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            cursor: pointer;
        }

        .file-info:hover .file-name {
            color: var(--primary-color);
            text-decoration: underline;
        }

        .file-name {
            font-weight: 500;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            transition: all 0.2s;
        }

        .file-size {
            font-size: 0.8125rem;
            color: #666;
        }

        .file-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        /* Preview Dialog */
        .preview-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            background: #f8f9fa;
            padding: 1rem;
        }

        .preview-image {
            max-width: 100%;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 8px;
        }

        .preview-iframe {
            width: 100%;
            height: 70vh;
            border: none;
            border-radius: 8px;
        }

        .no-preview {
            text-align: center;
            padding: 3rem;
        }

        .no-preview i {
            font-size: 5rem;
            color: #999;
            margin-bottom: 1rem;
        }

        .no-preview p {
            color: #666;
            margin-bottom: 1.5rem;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: #999;
        }

        .empty-state i {
            font-size: 4rem;
            margin-bottom: 1rem;
            display: block;
        }

        .empty-state p {
            margin: 0.5rem 0;
        }

        /* Loading & Error States */
        .loading-state,
        .error-state {
            text-align: center;
            padding: 4rem 2rem;
        }

        .error-state i {
            font-size: 4rem;
            color: #ff6b6b;
            margin-bottom: 1rem;
        }

        .error-state h3 {
            margin: 1rem 0 0.5rem 0;
        }

        .error-state p {
            color: #666;
            margin-bottom: 2rem;
        }

        .loading-files {
            text-align: center;
            padding: 2rem;
        }

        .loading-files i {
            font-size: 2rem;
            color: var(--primary-color);
        }

        :host ::ng-deep {
            .p-fileupload-choose {
                display: none !important;
            }
            
            .p-dialog .p-dialog-content {
                padding: 0 !important;
            }
        }
    `]
})
export class EventDetailComponent implements OnInit {
    loading = false;
    loadingFiles = false;
    event?: Event;
    files: FileUpload[] = [];
    eventId?: string;
    
    filePreviewVisible = false;
    selectedFile?: FileUpload;
    filePreviewUrl: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private eventService: EventService,
        private fileService: FileService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private sanitizer: DomSanitizer
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
            next: (event: Event) => {
                this.event = event;
                this.loading = false;
                console.log(' Événement chargé:', event);
            },
            error: (err: any) => {
                console.error(' Erreur chargement événement:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger l\'événement',
                    life: 3000
                });
                this.loading = false;
            }
        });
    }

    loadFiles(): void {
        if (!this.eventId) return;

        this.loadingFiles = true;
        this.fileService.getFilesByEvent(this.eventId).subscribe({
            next: (files: FileUpload[]) => {
                this.files = files;
                this.loadingFiles = false;
                console.log(' Fichiers chargés:', files.length);
            },
            error: (err: any) => {
                console.error(' Erreur chargement fichiers:', err);
                this.loadingFiles = false;
            }
        });
    }

    openFilePreview(file: FileUpload): void {
        this.selectedFile = file;
        
        this.fileService.downloadFile(file.id!).subscribe({
            next: (blob: Blob) => {
                const url = URL.createObjectURL(blob);
                this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
                this.filePreviewVisible = true;
            },
            error: (err: any) => {
                console.error('Erreur prévisualisation:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible d\'afficher le fichier',
                    life: 3000
                });
            }
        });
    }

    closePreview(): void {
        this.filePreviewVisible = false;
        if (this.filePreviewUrl) {
            const url = this.filePreviewUrl.changingThisBreaksApplicationSecurity;
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        }
        this.selectedFile = undefined;
        this.filePreviewUrl = null;
    }

    downloadFileOnly(file: FileUpload): void {
        if (!file.id) return;

        this.fileService.downloadFile(file.id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Fichier téléchargé',
                    life: 2000
                });
            },
            error: (err: any) => {
                console.error(' Erreur téléchargement:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec du téléchargement',
                    life: 3000
                });
            }
        });
    }

    isImage(fileName: string | undefined): boolean {
        if (!fileName) return false;
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
    }

    isPDF(fileName: string | undefined): boolean {
        if (!fileName) return false;
        return fileName.toLowerCase().endsWith('.pdf');
    }

    getFileUrl(fileId: string): string {
        return `http://localhost:8081/api/v1/cge-agenda/file/download/${fileId}`;
    }

    onFileUpload(event: any): void {
        if (!this.eventId) return;

        const files = event.files;
        let uploadedCount = 0;

        for (let file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('eventId', this.eventId);

            this.fileService.uploadFile(formData).subscribe({
                next: () => {
                    uploadedCount++;
                    if (uploadedCount === files.length) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: `${uploadedCount} fichier(s) ajouté(s)`,
                            life: 3000
                        });
                        this.loadFiles();
                    }
                },
                error: (err: any) => {
                    console.error(' Erreur upload:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: `Échec d'upload de ${file.name}`,
                        life: 3000
                    });
                }
            });
        }
    }

    confirmDeleteFile(file: FileUpload): void {
        this.confirmationService.confirm({
            message: `Supprimer le fichier "${file.fileName}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui',
            rejectLabel: 'Non',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteFile(file.id!);
            }
        });
    }

    deleteFile(fileId: string): void {
        this.fileService.deleteFile(fileId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Fichier supprimé',
                    life: 2000
                });
                this.loadFiles();
            },
            error: (err: any) => {
                console.error(' Erreur suppression:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec de la suppression',
                    life: 3000
                });
            }
        });
    }

    downloadAttendance(): void {
        if (!this.eventId) return;

        this.eventService.generateAttendanceSheet(this.eventId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `liste_emargement_${this.eventId}.pdf`; 
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Liste d\'émargement téléchargée',
                    life: 2000
                });
            },
            error: (err: any) => {
                console.error(' Erreur téléchargement:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Échec du téléchargement',
                    life: 3000
                });
            }
        });
    }

    getFileIcon(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const iconMap: { [key: string]: string } = {
            'pdf': 'pi pi-file-pdf text-red-500',
            'doc': 'pi pi-file-word text-blue-500',
            'docx': 'pi pi-file-word text-blue-500',
            'xls': 'pi pi-file-excel text-green-500',
            'xlsx': 'pi pi-file-excel text-green-500',
            'ppt': 'pi pi-file text-orange-500',
            'pptx': 'pi pi-file text-orange-500',
            'txt': 'pi pi-file-edit text-gray-500',
            'zip': 'pi pi-file text-purple-500',
            'rar': 'pi pi-file text-purple-500'
        };
        return iconMap[extension || ''] || 'pi pi-file text-gray-500';
    }

    formatFileSize(bytes: number | undefined): string {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    calculateDuration(): number {
        if (!this.event) return 0;
        const start = new Date(this.event.startDate);
        const end = new Date(this.event.endDate);
        const diff = Math.abs(end.getTime() - start.getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
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

    editEvent(): void {
        if (this.eventId) {
            this.router.navigate(['/events', this.eventId, 'edit']);
        }
    }

    goBack(): void {
        this.router.navigate(['/events']);
    }
}