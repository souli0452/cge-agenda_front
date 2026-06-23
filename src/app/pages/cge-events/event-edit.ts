import { Component, OnInit } from '@angular/core';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators,
         ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Button }        from 'primeng/button';
import { InputText }     from 'primeng/inputtext';
import { Toast }         from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Skeleton }      from 'primeng/skeleton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Dialog }        from 'primeng/dialog';
import { Tooltip }       from 'primeng/tooltip';
import { Select }        from 'primeng/select';
import { TableModule }   from 'primeng/table';
import { Textarea }           from 'primeng/textarea';
import { AutoCompleteModule } from 'primeng/autocomplete';

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
        Dialog, Tooltip, Select, TableModule, Textarea, AutoCompleteModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './event-edit.html',
    styleUrls:   ['./event-edit.css']
})
export class EventEditComponent implements OnInit, HasUnsavedChanges {

    eventForm!: FormGroup;
    eventId?: string;
    loading             = false;
    saving              = false;
    loadingParticipants = false;
    loadingFiles        = false;

    currentStatus = 'PLANIFIE';

    participants:          Participant[] = [];
    files:                 FileUpload[]  = [];
    participantSuggestions: any[] = [];

    addParticipantDialogVisible = false;
    selectedParticipantToAdd: any;

    // ==========================================
    // OPTIONS — Types événement
    // ==========================================
    eventTypes = [
        { label: 'Réunion',    value: 'REUNION'    },
        { label: 'Conférence', value: 'CONFERENCE' },
        { label: 'Atelier',    value: 'ATELIER'    },
        { label: 'Séminaire',  value: 'SEMINAIRE'  },
        { label: 'Formation',  value: 'FORMATION'  },
        { label: 'Mission',    value: 'MISSION'    },
        { label: 'Autre',      value: 'AUTRE'      }
    ];

    // ==========================================
    // ✅ OPTIONS — Types de lieu
    // ==========================================
    lieuTypes = [
        { label: '🏛️ Interne — Dans le bâtiment ASCELC', value: 'INTERNE'       },
        { label: '🇧🇫 National — Burkina Faso',           value: 'NATIONAL'      },
        { label: '✈️ International — À l\'étranger',      value: 'INTERNATIONAL' },
        { label: '💻 Virtuel — Réunion en ligne',          value: 'VIRTUEL'       }
    ];

    // ✅ Salles internes ASCELC
   sallesDisponibles = [
    { label: 'Bureau CGE',                  value: 'Bureau CGE'                  },
    { label: 'Bureau CGEA',                 value: 'Bureau CGEA'                 },
    { label: 'Salle de Réunion RDC',        value: 'Salle de Réunion RDC'        },
    { label: 'Salle de Réunion 1er Étage',  value: 'Salle de Réunion 1er Étage'  },
    { label: 'Salle de Réunion 3ème Étage', value: 'Salle de Réunion 3ème Étage' },
    { label: 'Salle de Réunion 4ème Étage', value: 'Salle de Réunion 4ème Étage' },
    { label: 'Salle de Réunion 5ème Étage', value: 'Salle de Réunion 5ème Étage' },
    { label: 'Salle de Conférence',         value: 'Salle de Conférence'         },
    { label: 'Autre',                       value: 'Autre'                       }
];

    // ✅ Villes Burkina Faso
    villesBurkina = [
        'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou',
        'Banfora', 'Ouahigouya', 'Kaya', 'Dédougou',
        'Fada N\'Gourma', 'Tenkodogo', 'Dori', 'Autre'
    ].map(v => ({ label: v, value: v }));

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

    hasUnsavedChanges(): boolean {
        return this.eventForm?.dirty ?? false;
    }

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('id') || undefined;
        if (this.eventId) {
            this.loadEvent();
            this.loadParticipants();
            this.loadFiles();
        }
    }

    // ==========================================
    // INITIALISATION DU FORMULAIRE
    // ==========================================
    initForm(): void {
        this.eventForm = this.fb.group({
            title:       ['', Validators.required],
            type:        ['', Validators.required],
            description: [''],
            startDate:   ['', Validators.required],
            endDate:     ['', Validators.required],

            // ✅ Champs lieu enrichis
            lieuType:    [''],
            salle:       [''],       // INTERNE
            ville:       [''],       // NATIONAL + INTERNATIONAL
            pays:        [''],       // INTERNATIONAL
            nomLieu:     [''],       // NATIONAL + INTERNATIONAL
            meetingLink: ['']        // VIRTUEL + tous
        });

        // ✅ Réinitialiser les champs lieu quand lieuType change
        this.eventForm.get('lieuType')?.valueChanges.subscribe(type => {
            this.eventForm.patchValue({
                salle:       '',
                ville:       '',
                pays:        '',
                nomLieu:     '',
                meetingLink: ''
            }, { emitEvent: false });
        });
    }

    // ==========================================
    // GETTER — type de lieu courant
    // ==========================================
    get currentLieuType(): string {
        return this.eventForm.get('lieuType')?.value || '';
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
                    // ✅ Champs lieu
                    lieuType:    (event as any).lieuType    || '',
                    salle:       (event as any).salle       || '',
                    ville:       event.ville       || '',
                    pays:        event.pays        || '',
                    nomLieu:     (event as any).nomLieu     || '',
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
            next: (p) => { this.participants = p; this.loadingParticipants = false; },
            error: ()  => { this.loadingParticipants = false; }
        });
    }

    loadFiles(): void {
        if (!this.eventId) return;
        this.loadingFiles = true;
        this.fileService.getFilesByEvent(this.eventId).subscribe({
            next: (f) => { this.files = f; this.loadingFiles = false; },
            error: ()  => { this.loadingFiles = false; }
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
            status:      this.currentStatus,
            // ✅ Champs lieu
            lieuType:    fv.lieuType    || null,
            salle:       fv.salle?.trim()    || null,
            ville:       fv.ville?.trim()    || null,
            pays:        fv.pays?.trim()     || null,
            nomLieu:     fv.nomLieu?.trim()  || null,
            meetingLink: fv.meetingLink?.trim() || null,
            // Champs requis par le backend
            globalStartTime: undefined,
            globalEndTime:   undefined,
            schedules:       [],
            participants:    [],
            files:           []
        };

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
            error: (err: any) => {
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
        this.selectedParticipantToAdd    = null;
        this.participantSuggestions      = [];
        this.addParticipantDialogVisible = true;
    }

    onParticipantSearch(event: { query: string }): void {
        const q = event.query?.trim();
        if (!q) { this.participantSuggestions = []; return; }
        const addedIds = new Set(this.participants.map(p => p.id));
        this.participantService.autocompleteParticipants(q).subscribe({
            next: (results: Participant[]) => {
                this.participantSuggestions = results
                    .filter(p => !addedIds.has(p.id))
                    .map(p => ({ ...p, displayName: `${p.firstName} ${p.lastName} (${p.email})` }));
            },
            error: () => { this.participantSuggestions = []; }
        });
    }

    addParticipant(): void {
        if (!this.selectedParticipantToAdd || !this.eventId) return;
        this.eventService.addParticipant(
            this.eventId, this.selectedParticipantToAdd
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Succès',
                    detail: 'Participant ajouté avec succès'
                });
                this.loadParticipants();
                this.selectedParticipantToAdd    = null;
                this.participantSuggestions      = [];
                this.addParticipantDialogVisible = false;
            },
            error: (err: any) => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: err.error?.message || 'Impossible d\'ajouter le participant'
            })
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
                    severity: 'success', summary: 'Succès',
                    detail: 'Participant retiré avec succès'
                });
                this.loadParticipants();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: 'Impossible de retirer le participant'
            })
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
                        severity: 'success', summary: 'Succès',
                        detail: `Fichier "${file.name}" ajouté`
                    });
                    this.loadFiles();
                },
                error: () => this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: `Impossible d'ajouter "${file.name}"`
                })
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
                a.href = url; a.download = file.fileName; a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: 'Impossible de télécharger le fichier'
            })
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
                    severity: 'success', summary: 'Succès',
                    detail: 'Fichier supprimé'
                });
                this.loadFiles();
            },
            error: () => this.messageService.add({
                severity: 'error', summary: 'Erreur',
                detail: 'Impossible de supprimer le fichier'
            })
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