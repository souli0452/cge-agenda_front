import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Button }              from 'primeng/button';
import { InputText }           from 'primeng/inputtext';
import { Toast }               from 'primeng/toast';
import { ConfirmDialog }       from 'primeng/confirmdialog';
import { Skeleton }            from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Dialog }              from 'primeng/dialog';
import { Tooltip }             from 'primeng/tooltip';
import { Select }              from 'primeng/select';
import { TableModule }         from 'primeng/table';
import { Textarea }            from 'primeng/textarea';

import { EventService }       from '../../service/event.service';
import { FileService }        from '../../service/file.service';
import { ParticipantService } from '../../service/participant.service';
import { Event, FileUpload, Participant } from '../../models';

@Component({
    selector: 'app-event-edit',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, FormsModule,
        Button, InputText, Toast, ConfirmDialog, Skeleton,
        Dialog, Tooltip, Select, TableModule, Textarea
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './event-edit.html',
    styleUrls: ['./event-edit.css']
})
export class EventEditComponent implements OnInit {

    eventForm!: FormGroup;
    eventId?: string;
    loading             = false;
    saving              = false;
    loadingParticipants = false;
    loadingFiles        = false;

    currentStatus: string = 'PLANIFIE';

    participants:          Participant[] = [];
    files:                 FileUpload[]  = [];
    availableParticipants: any[]         = [];

    addParticipantDialogVisible = false;
    selectedParticipantToAdd: any;

    eventTypes = [
        { label: 'Réunion',    value: 'REUNION'    },
        { label: 'Conférence', value: 'CONFERENCE' },
        { label: 'Atelier',    value: 'ATELIER'    },
        { label: 'Séminaire',  value: 'SEMINAIRE'  },
        { label: 'Formation',  value: 'FORMATION'  },
        { label: 'Mission',    value: 'MISSION'    },
        { label: 'Autre',      value: 'AUTRE'      }
    ];

    constructor(
        private fb:                  FormBuilder,
        private route:               ActivatedRoute,
        private router:              Router,
        private eventService:        EventService,
        private fileService:         FileService,
        private participantService:  ParticipantService,
        private messageService:      MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('id') || undefined;
        if (this.eventId) {
            this.loadEvent();
            this.loadParticipants();
            this.loadFiles();
            this.loadAvailableParticipants();
        }
    }

    initForm(): void {
        this.eventForm = this.fb.group({
            title:       ['', Validators.required],
            type:        ['', Validators.required],
            description: [''],
            startDate:   ['', Validators.required],
            endDate:     ['', Validators.required],
            ville:       [''],
            pays:        [''],
            meetingLink: ['']
        });
    }

    // ==========================================
    // CHARGEMENT
    // ==========================================
    loadEvent(): void {
        if (!this.eventId) return;
        this.loading = true;

        this.eventService.getEventById(this.eventId).subscribe({
            next: (event: Event) => {
                this.currentStatus = event.status || 'PLANIFIE';

                this.eventForm.patchValue({
                    title:       event.title       || '',
                    type:        event.type        || '',
                    description: event.description || '',
                    startDate:   event.startDate   || '',
                    endDate:     event.endDate     || '',
                    ville:       event.ville       || '',
                    pays:        event.pays        || '',
                    meetingLink: event.meetingLink || ''
                });
                this.loading = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger l\'événement'
                });
                this.loading = false;
            }
        });
    }

    loadParticipants(): void {
        if (!this.eventId) return;
        this.loadingParticipants = true;

        this.eventService.getEventParticipants(this.eventId).subscribe({
            next: (p) => {
                this.participants        = p;
                this.loadingParticipants = false;
            },
            error: () => { this.loadingParticipants = false; }
        });
    }

    loadFiles(): void {
        if (!this.eventId) return;
        this.loadingFiles = true;

        this.fileService.getFilesByEvent(this.eventId).subscribe({
            next: (f) => {
                this.files        = f;
                this.loadingFiles = false;
            },
            error: () => { this.loadingFiles = false; }
        });
    }

    loadAvailableParticipants(): void {
        this.participantService.getAllParticipants().subscribe({
            next: (participants) => {
                this.availableParticipants = participants
                    .filter(p => !this.participants.some(ep => ep.id === p.id))
                    .map(p => ({
                        ...p,
                        displayName: `${p.firstName} ${p.lastName} (${p.email})`
                    }));
            }
        });
    }

    // ==========================================
    // SOUMISSION
    // ==========================================
    onSubmit(): void {
        if (this.eventForm.invalid) {
            this.eventForm.markAllAsTouched();
            this.messageService.add({
                severity: 'warn',
                summary: 'Attention',
                detail: 'Veuillez remplir tous les champs obligatoires'
            });
            return;
        }

        if (!this.eventId) return;
        this.saving = true;

        const fv = this.eventForm.value;

        const eventData: any = {
            title:       fv.title?.trim(),
            type:        fv.type,
            description: fv.description?.trim() || null,
            startDate:   fv.startDate,
            endDate:     fv.endDate,
            ville:       fv.ville?.trim()       || null,
            pays:        fv.pays?.trim()        || null,
            meetingLink: fv.meetingLink?.trim() || null,
            status:          this.currentStatus,
            globalStartTime: undefined,
            globalEndTime:   undefined,
            schedules:       [],
            participants:    [],
            files:           []
        };

        console.log('📤 Update payload:', JSON.stringify(eventData, null, 2));

        this.eventService.updateEvent(this.eventId, eventData).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Événement modifié avec succès'
                });
                setTimeout(() => {
                    this.router.navigate(['/events'], {
                        queryParams: { updated: this.eventId }
                    });
                }, 1000);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Impossible de modifier l\'événement'
                });
                this.saving = false;
            }
        });
    }

    // ==========================================
    // PARTICIPANTS
    // ==========================================
    showAddParticipantDialog(): void {
        this.loadAvailableParticipants();
        this.selectedParticipantToAdd    = null;
        this.addParticipantDialogVisible = true;
    }

    addParticipant(): void {
        if (!this.selectedParticipantToAdd || !this.eventId) return;

        this.eventService.addParticipant(
            this.eventId, this.selectedParticipantToAdd
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Participant ajouté avec succès'
                });
                this.loadParticipants();
                this.loadAvailableParticipants();
                this.addParticipantDialogVisible = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.message || 'Impossible d\'ajouter le participant'
                });
            }
        });
    }

    confirmRemoveParticipant(participant: Participant): void {
        this.confirmationService.confirm({
            message: `Retirer ${participant.firstName} ${participant.lastName} ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, retirer',
            rejectLabel: 'Annuler',
            accept: () => this.removeParticipant(participant.id!)
        });
    }

    removeParticipant(participantId: string): void {
        if (!this.eventId) return;

        this.eventService.removeParticipant(this.eventId, participantId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Participant retiré avec succès'
                });
                this.loadParticipants();
                this.loadAvailableParticipants();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de retirer le participant'
                });
            }
        });
    }

    // ==========================================
    // FICHIERS
    // ==========================================
    onFileSelected(event: any): void {
        if (!this.eventId) return;

        const files = event.target.files;
        for (const file of files) {
            const formData = new FormData();
            formData.append('file',    file);
            formData.append('eventId', this.eventId);

            this.fileService.uploadFile(formData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: `Fichier "${file.name}" ajouté`
                    });
                    this.loadFiles();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: `Impossible d'ajouter "${file.name}"`
                    });
                }
            });
        }
        event.target.value = '';
    }

    downloadFile(file: FileUpload): void {
        if (!file.id) return;

        this.fileService.downloadFile(file.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = file.fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de télécharger le fichier'
                });
            }
        });
    }

    confirmDeleteFile(file: FileUpload): void {
        this.confirmationService.confirm({
            message: `Supprimer "${file.fileName}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, supprimer',
            rejectLabel: 'Annuler',
            accept: () => this.deleteFile(file.id!)
        });
    }

    deleteFile(fileId: string): void {
        this.fileService.deleteFile(fileId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Fichier supprimé'
                });
                this.loadFiles();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de supprimer le fichier'
                });
            }
        });
    }

    // ==========================================
    // HELPERS
    // ==========================================
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

    formatFileSize(bytes: number | undefined): string {
        if (!bytes) return '0 B';
        const k     = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i     = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    goBack(): void {
        this.router.navigate(['/events']);
    }
}