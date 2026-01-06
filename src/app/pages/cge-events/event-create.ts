import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PACKAGE POUR PAYS ET VILLES
import { Country, City } from 'country-state-city';

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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';

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
        IconFieldModule,
        InputIconModule,
        TooltipModule,
        ProgressSpinnerModule,
        SkeletonModule
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

    // PAYS ET VILLES
    countries: any[] = [];
    cities: any[] = [];
    selectedCountryCode: string = 'BF'; 

    // ÉTAPES POUR LA PROGRESSION HORIZONTALE
    steps = [
        { number: 1, label: 'Informations générales', icon: 'pi-info-circle' },
        { number: 2, label: 'Dates et Lieu', icon: 'pi-calendar' },
        { number: 3, label: 'Horaires', icon: 'pi-clock' },
        { number: 4, label: 'Participants', icon: 'pi-users', optional: true },
        { number: 5, label: 'Documents', icon: 'pi-paperclip', optional: true },
        { number: 6, label: 'Récapitulatif', icon: 'pi-check-circle' }
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
        this.loadCountries();
        this.loadCities('BF'); 
    }

    // ==========================================
    // CHARGEMENT DES PAYS
    // ==========================================

    loadCountries(): void {
        try {
            const allCountries = Country.getAllCountries();
            this.countries = allCountries.map(country => ({
                label: country.name,
                value: country.name,
                code: country.isoCode
            })).sort((a, b) => a.label.localeCompare(b.label));
            
            console.log(' Pays chargés:', this.countries.length);
        } catch (error) {
            console.error(' Erreur chargement pays:', error);
        }
    }

    // ==========================================
    //  CHARGEMENT DES VILLES
    // ==========================================

    loadCities(countryCode: string): void {
        try {
            const citiesData = City.getCitiesOfCountry(countryCode);
            
            if (citiesData && citiesData.length > 0) {
                this.cities = citiesData.map(city => ({
                    label: city.name,
                    value: city.name
                })).sort((a, b) => a.label.localeCompare(b.label));
            } else {
                this.cities = [];
            }
            
            console.log(` Villes chargées pour ${countryCode}:`, this.cities.length);
        } catch (error) {
            console.error('Erreur chargement villes:', error);
            this.cities = [];
        }
    }

    onCountryChange(event: any): void {
        const selectedCountryName = event.value;
        console.log('Pays sélectionné:', selectedCountryName);
        
        // Trouver le code du pays
        const country = this.countries.find(c => c.value === selectedCountryName);
        
        if (country) {
            this.selectedCountryCode = country.code;
            this.loadCities(country.code);
            this.eventForm.get('ville')?.setValue(''); 
        } else {
            this.cities = [];
            this.eventForm.get('ville')?.setValue('');
        }
    }

    hasCities(): boolean {
        return this.cities.length > 0;
    }

    // ==========================================
    // PROGRESSION HORIZONTALE
    // ==========================================

    get progressValue(): number {
        return ((this.currentStep + 1) / 6) * 100;
    }

    getStepClass(index: number): string {
        if (index < this.currentStep) return 'step-completed';
        if (index === this.currentStep) return 'step-active';
        return 'step-pending';
    }

    isStepClickable(index: number): boolean {
        
        if (index < this.currentStep) return true;
        
        // Pour aller en avant
        if (index === this.currentStep + 1) {
            return this.canProceedFromStep(this.currentStep);
        }
        
        return false;
    }

    onStepClick(index: number): void {
        if (this.isStepClickable(index)) {
            this.goToStep(index);
        }
    }

    goToStep(step: number): void {
        if (step > this.currentStep && !this.canProceedFromStep(this.currentStep)) {
            this.markStepFieldsAsTouched(this.currentStep);
            this.messageService.add({
                severity: 'warn',
                summary: '⚠ Champs obligatoires manquants',
                detail: 'Veuillez remplir tous les champs requis avant de continuer',
                life: 4000
            });
            return;
        }

        this.currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // VALIDATION DES ÉTAPES
    // ==========================================

    canProceedFromStep(stepIndex: number): boolean {
        switch (stepIndex) {
            case 0: // Informations générales
                return !!(this.eventForm.get('title')?.valid && 
                          this.eventForm.get('type')?.valid);
            
            case 1: // Dates et Lieu
                const startDate = this.eventForm.get('startDate');
                const endDate = this.eventForm.get('endDate');
                return !!(startDate?.valid && endDate?.valid);
            
            case 2: // Horaires
                if (this.scheduleMode === 'global') {
                    return !!(this.eventForm.get('globalStartTime')?.valid && 
                              this.eventForm.get('globalEndTime')?.valid);
                } else {
                    return this.schedules.length > 0 && this.schedules.valid;
                }
            
            case 3: // Participants - optionnel
            case 4: // Documents - optionnel
                return true;
            
            default:
                return true;
        }
    }

    markStepFieldsAsTouched(stepIndex: number): void {
        switch (stepIndex) {
            case 0:
                this.eventForm.get('title')?.markAsTouched();
                this.eventForm.get('type')?.markAsTouched();
                break;
            case 1:
                this.eventForm.get('startDate')?.markAsTouched();
                this.eventForm.get('endDate')?.markAsTouched();
                break;
            case 2:
                if (this.scheduleMode === 'global') {
                    this.eventForm.get('globalStartTime')?.markAsTouched();
                    this.eventForm.get('globalEndTime')?.markAsTouched();
                } else {
                    this.schedules.controls.forEach(control => {
                        Object.keys(control.value).forEach(key => {
                            control.get(key)?.markAsTouched();
                        });
                    });
                }
                break;
        }
    }

    // ==========================================
    // FORM INITIALIZATION
    // ==========================================

    initForm(): void {
        this.eventForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            type: ['', Validators.required],
            status: ['PLANIFIE', Validators.required],
            
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            pays: ['Burkina Faso'],
            ville: ['Ouagadougou'],
            meetingLink: [''],
            
            globalStartTime: ['09:00', Validators.required],
            globalEndTime: ['17:00', Validators.required],
            schedules: this.fb.array([]),
            
            participants: this.fb.array([])
        });

        this.addSchedule();
    }

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
        
        this.messageService.add({
            severity: 'success',
            summary: ' Ajouté',
            detail: 'Horaire ajouté avec succès',
            life: 2000
        });
    }

    removeSchedule(index: number): void {
        if (this.schedules.length > 1) {
            this.schedules.removeAt(index);
            this.messageService.add({
                severity: 'error',
                summary: '🗑 Supprimé',
                detail: 'Horaire supprimé avec succès',
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
            participantType: ['INTERNE', Validators.required]
        });
        this.participants.push(participantGroup);

        this.messageService.add({
            severity: 'success',
            summary: ' Ajouté',
            detail: 'Participant ajouté avec succès',
            life: 2000
        });

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
            severity: 'error',
            summary: '🗑 Supprimé',
            detail: 'Participant supprimé avec succès',
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
                    summary: '⚠ Fichier trop volumineux',
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
                summary: ' Ajouté',
                detail: `${files.length} fichier(s) ajouté(s) avec succès`,
                life: 3000
            });
        }
    }

    removeFile(index: number): void {
        const fileName = this.uploadedFiles[index].file.name;
        this.uploadedFiles.splice(index, 1);
        this.messageService.add({
            severity: 'error',
            summary: '🗑 Supprimé',
            detail: `${fileName} retiré avec succès`,
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

    getParticipantTypeLabel(typeValue: string): string {
        const option = this.participantTypeOptions.find(opt => opt.value === typeValue);
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

    // CALCUL DE DURÉE 
    calculateDuration(start: Date, end: Date): string {
        if (!start || !end) return 'Non calculable';
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        // Mettre les heures à 0 pour comparer uniquement les jours
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le dernier jour
        
        return diffDays === 1 ? '1 jour' : `${diffDays} jours`;
    }

    // ==========================================
    // SUBMIT
    // ==========================================

    async onSubmit(): Promise<void> {
    if (!this.canProceedFromStep(0) || !this.canProceedFromStep(1) || !this.canProceedFromStep(2)) {
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

        console.log('Données envoyées:', eventData);

        const createdEvent = await this.eventService.createEvent(eventData).toPromise();

        // UPLOAD DES FICHIERS SI PRÉSENTS
        if (createdEvent && createdEvent.id && this.uploadedFiles.length > 0) {
            await this.uploadFiles(createdEvent.id);
        }

        this.messageService.add({
            severity: 'success',
            summary: '🎉 Événement créé avec succès !',
            detail: 'Redirection vers la liste...',
            life: 3000
        });

        // ✅ REDIRECTION VERS LA LISTE AVEC PARAMÈTRE
        setTimeout(() => {
            this.router.navigate(['/events'], { 
                queryParams: { 
                    created: createdEvent?.id,
                    timestamp: Date.now() 
                } 
            });
        }, 1500);

    } catch (error: any) {
        console.error('Erreur:', error);
        this.loading = false;
        
        const errorMessage = error.error?.message || error.message || 'Erreur inconnue';
        this.messageService.add({
            severity: 'error',
            summary: '❌ Erreur de création',
            detail: errorMessage,
            life: 6000
        });
    }
}

    // UPLOAD DES FICHIERS
    async uploadFiles(eventId: string): Promise<void> {
        const uploadPromises = this.uploadedFiles.map(item => {
            // Créer un FormData pour chaque fichier
            const formData = new FormData();
            formData.append('file', item.file);
            formData.append('eventId', eventId);
            
            return this.fileService.uploadFile(formData).toPromise();
        });
        
        await Promise.all(uploadPromises);
        console.log(` ${this.uploadedFiles.length} fichier(s) uploadé(s) avec succès`);
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