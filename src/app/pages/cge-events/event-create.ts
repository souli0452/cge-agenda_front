import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StepperModule } from 'primeng/stepper';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';

// Services & Models
import { EventService } from '../../service/event.service';
import { FileService } from '../../service/file.service';
import {
    Event,
    EVENT_TYPE_OPTIONS,
    EVENT_STATUS_OPTIONS,
    PARTICIPANT_TYPE_OPTIONS
} from '../../models';

interface UploadedFile {
    file: File;
    preview?: string;
}

@Component({
    selector: 'app-event-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        DatePickerModule,
        SelectModule,
        RadioButtonModule,
        CardModule,
        DividerModule,
        ToastModule,
        StepperModule,
        IconFieldModule,
        InputIconModule,
        ProgressBarModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './event-create.html',
    styleUrl: './event-create.css'
})
export class EventCreateComponent implements OnInit {
    loading = false;
    eventForm!: FormGroup;
    scheduleMode: 'global' | 'custom' = 'global';
    uploadedFiles: UploadedFile[] = [];
    currentStep = 0;

    typeOptions = EVENT_TYPE_OPTIONS;
    statusOptions = EVENT_STATUS_OPTIONS;
    participantTypeOptions = PARTICIPANT_TYPE_OPTIONS;

    // Liste des pays
    countries = [
        { label: 'Algérie', value: 'Algérie' },
        { label: 'Angola', value: 'Angola' },
        { label: 'Bénin', value: 'Bénin' },
        { label: 'Botswana', value: 'Botswana' },
        { label: 'Burkina Faso', value: 'Burkina Faso' },
        { label: 'Burundi', value: 'Burundi' },
        { label: 'Cameroun', value: 'Cameroun' },
        { label: 'Cap-Vert', value: 'Cap-Vert' },
        { label: 'Centrafrique', value: 'Centrafrique' },
        { label: 'Comores', value: 'Comores' },
        { label: 'Congo', value: 'Congo' },
        { label: 'Congo (RDC)', value: 'Congo (RDC)' },
        { label: 'Côte d\'Ivoire', value: 'Côte d\'Ivoire' },
        { label: 'Djibouti', value: 'Djibouti' },
        { label: 'Égypte', value: 'Égypte' },
        { label: 'Gabon', value: 'Gabon' },
        { label: 'Gambie', value: 'Gambie' },
        { label: 'Ghana', value: 'Ghana' },
        { label: 'Guinée', value: 'Guinée' },
        { label: 'Kenya', value: 'Kenya' },
        { label: 'Madagascar', value: 'Madagascar' },
        { label: 'Mali', value: 'Mali' },
        { label: 'Maroc', value: 'Maroc' },
        { label: 'Mauritanie', value: 'Mauritanie' },
        { label: 'Niger', value: 'Niger' },
        { label: 'Nigeria', value: 'Nigeria' },
        { label: 'Sénégal', value: 'Sénégal' },
        { label: 'Tchad', value: 'Tchad' },
        { label: 'Togo', value: 'Togo' },
        { label: 'Tunisie', value: 'Tunisie' },
        { label: 'France', value: 'France' },
        { label: 'Belgique', value: 'Belgique' },
        { label: 'Suisse', value: 'Suisse' },
        { label: 'Canada', value: 'Canada' },
        { label: 'États-Unis', value: 'États-Unis' },
        { label: 'Autre', value: 'Autre' }
    ];

    constructor(
        private fb: FormBuilder,
        private eventService: EventService,
        private fileService: FileService,
        private router: Router,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.initForm();
    }

    // ==========================================
    // PROGRESSION
    // ==========================================

    get progressValue(): number {
        return ((this.currentStep + 1) / 7) * 100;
    }

    goToStep(step: number): void {
        this.currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // FORM INITIALIZATION
    // ==========================================

    initForm(): void {
        this.eventForm = this.fb.group({
            // Identification
            title: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            type: ['', Validators.required],
            status: ['PLANIFIE', Validators.required],
            
            // Période
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            
            // Localisation
            pays: ['Burkina Faso'],
            ville: ['Ouagadougou'],
            meetingLink: [''],
            
            // Horaires
            globalStartTime: ['09:00'],
            globalEndTime: ['17:00'],
            schedules: this.fb.array([]),
            
            // Participants
            participants: this.fb.array([])
        });

        this.addSchedule();
    }

    // ==========================================
    // GETTERS
    // ==========================================

    get schedules(): FormArray {
        return this.eventForm.get('schedules') as FormArray;
    }

    get participants(): FormArray {
        return this.eventForm.get('participants') as FormArray;
    }

    // ==========================================
    // SCHEDULE MANAGEMENT
    // ==========================================

    onScheduleModeChange(mode: string): void {
        this.scheduleMode = mode as 'global' | 'custom';
        if (this.scheduleMode === 'custom' && this.schedules.length === 0) {
            this.addSchedule();
        }
    }

    addSchedule(): void {
        const scheduleGroup = this.fb.group({
            dateJour: ['', Validators.required],
            startTime: ['09:00', Validators.required],
            endTime: ['17:00', Validators.required],
            address: ['']
        });
        this.schedules.push(scheduleGroup);
    }

    removeSchedule(index: number): void {
        if (this.schedules.length > 1) {
            this.schedules.removeAt(index);
            this.messageService.add({
                severity: 'info',
                summary: 'Horaire supprimé',
                life: 2000
            });
        }
    }

    // ==========================================
    // PARTICIPANT MANAGEMENT
    // ==========================================

    addParticipant(): void {
        const participantGroup = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: [''],
            organization: [''],
            jobTitle: [''],
            participantType: ['EXTERNE', Validators.required]
        });
        this.participants.push(participantGroup);

        setTimeout(() => {
            const cards = document.querySelectorAll('.participant-card');
            if (cards.length > 0) {
                cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }

    removeParticipant(index: number): void {
        this.participants.removeAt(index);
        this.messageService.add({
            severity: 'info',
            summary: 'Participant supprimé',
            life: 2000
        });
    }

    // ==========================================
    // FILE UPLOAD
    // ==========================================

    onFileSelect(event: any): void {
        const files: FileList = event.target.files;
        this.handleFiles(files);
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        
        const files = event.dataTransfer?.files;
        if (files) {
            this.handleFiles(files);
        }
    }

    handleFiles(files: FileList): void {
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Fichier trop volumineux',
                    detail: `${file.name} dépasse 10 MB`,
                    life: 4000
                });
                return;
            }

            const uploadedFile: UploadedFile = { file };

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    uploadedFile.preview = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            this.uploadedFiles.push(uploadedFile);
        });

        if (files.length > 0) {
            this.messageService.add({
                severity: 'success',
                summary: 'Fichiers ajoutés',
                detail: `${files.length} fichier(s)`,
                life: 3000
            });
        }
    }

    removeFile(index: number): void {
        this.uploadedFiles.splice(index, 1);
        this.messageService.add({
            severity: 'info',
            summary: 'Fichier retiré',
            life: 2000
        });
    }

    getFileIcon(file: File): string {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();

        if (type.includes('pdf')) return 'pi pi-file-pdf text-red-500';
        if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) 
            return 'pi pi-file-word text-blue-500';
        if (type.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) 
            return 'pi pi-file-excel text-green-500';
        if (type.includes('image')) return 'pi pi-image text-purple-500';
        
        return 'pi pi-file text-gray-500';
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    // ==========================================
    // VALIDATION
    // ==========================================

    isStepValid(stepIndex: number): boolean {
        switch (stepIndex) {
            case 0: // Identification
                return !!(this.eventForm.get('title')?.valid && 
                          this.eventForm.get('type')?.valid);
            
            case 1: // Période
                return !!(this.eventForm.get('startDate')?.valid && 
                          this.eventForm.get('endDate')?.valid);
            
            case 2: // Localisation (toujours valide)
                return true;
            
            case 3: // Horaires
                if (this.scheduleMode === 'global') {
                    return !!(this.eventForm.get('globalStartTime')?.valid && 
                              this.eventForm.get('globalEndTime')?.valid);
                } else {
                    return this.schedules.length > 0 && this.schedules.valid;
                }
            
            default:
                return true;
        }
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.eventForm.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    getErrorMessage(controlName: string): string {
        const control = this.eventForm.get(controlName);
        if (control?.hasError('required')) return 'Ce champ est requis';
        if (control?.hasError('email')) return 'Email invalide';
        if (control?.hasError('minlength')) return 'Minimum 3 caractères';
        return '';
    }

    // ==========================================
    // DISPLAY HELPERS
    // ==========================================

    getTypeLabel(typeValue: string): string {
        const option = this.typeOptions.find(opt => opt.value === typeValue);
        return option ? option.label : 'Non défini';
    }

    formatDateDisplay(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // ==========================================
    // SUBMIT
    // ==========================================

    async onSubmit(): Promise<void> {
        if (!this.isStepValid(0) || !this.isStepValid(1) || !this.isStepValid(3)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulaire incomplet',
                detail: 'Veuillez remplir tous les champs obligatoires',
                life: 5000
            });
            return;
        }

        this.loading = true;

        try {
            const formValue = this.eventForm.value;

            let eventData: any = {
                title: formValue.title,
                description: formValue.description || null,
                type: formValue.type,
                status: 'PLANIFIE',
                startDate: this.formatDate(formValue.startDate),
                endDate: this.formatDate(formValue.endDate),
                pays: formValue.pays || null,
                ville: formValue.ville || null,
                meetingLink: formValue.meetingLink || null,
                schedules: []
            };

            if (this.scheduleMode === 'global') {
                eventData.schedules = [{
                    dateJour: this.formatDate(formValue.startDate),
                    startTime: formValue.globalStartTime + ':00',
                    endTime: formValue.globalEndTime + ':00',
                    address: formValue.ville || null
                }];
            } else {
                eventData.schedules = formValue.schedules
                    .filter((schedule: any) => schedule.dateJour)
                    .map((schedule: any) => ({
                        dateJour: this.formatDate(schedule.dateJour),
                        startTime: schedule.startTime + ':00',
                        endTime: schedule.endTime + ':00',
                        address: schedule.address || formValue.ville || null
                    }));
            }

            if (formValue.participants && formValue.participants.length > 0) {
                eventData.participants = formValue.participants.map((p: any) => ({
                    firstName: p.firstName,
                    lastName: p.lastName,
                    email: p.email,
                    phoneNumber: p.phoneNumber || null,
                    organization: p.organization || null,
                    jobTitle: p.jobTitle || null,
                    participantType: p.participantType
                }));
            }

            console.log('📤 Données envoyées:', eventData);

            const createdEvent = await this.eventService.createEvent(eventData).toPromise();

            if (createdEvent && createdEvent.id && this.uploadedFiles.length > 0) {
                await this.uploadFiles(createdEvent.id);
            }

            this.messageService.add({
                severity: 'success',
                summary: '🎉 Événement créé !',
                detail: 'Redirection en cours...',
                life: 3000
            });

            setTimeout(() => {
                this.router.navigate(['/events', createdEvent?.id]);
            }, 1500);

        } catch (error: any) {
            console.error('❌ Erreur:', error);
            this.loading = false;
            
            const errorMessage = error.error?.message || 'Erreur inconnue';
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur de création',
                detail: errorMessage,
                life: 6000
            });
        }
    }

    async uploadFiles(eventId: string): Promise<void> {
        const uploadPromises = this.uploadedFiles.map(item => {
            return this.fileService.uploadFile(eventId, item.file, '').toPromise();
        });
        await Promise.all(uploadPromises);
    }

    formatDate(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    cancel(): void {
        if (confirm('Êtes-vous sûr de vouloir annuler ? Toutes les données seront perdues.')) {
            this.router.navigate(['/events']);
        }
    }
}