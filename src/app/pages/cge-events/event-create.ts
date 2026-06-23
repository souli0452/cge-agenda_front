import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    FormBuilder, FormGroup, FormArray,
    Validators, ReactiveFormsModule, FormsModule
} from '@angular/forms';

import { Country, City } from 'country-state-city';

import { ButtonModule }          from 'primeng/button';
import { InputTextModule }       from 'primeng/inputtext';
import { TextareaModule }        from 'primeng/textarea';
import { DatePickerModule }      from 'primeng/datepicker';
import { SelectModule }          from 'primeng/select';
import { RadioButtonModule }     from 'primeng/radiobutton';
import { CardModule }            from 'primeng/card';
import { DividerModule }         from 'primeng/divider';
import { ToastModule }           from 'primeng/toast';
import { MessageService }        from 'primeng/api';
import { IconFieldModule }       from 'primeng/iconfield';
import { InputIconModule }       from 'primeng/inputicon';
import { TooltipModule }         from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule }        from 'primeng/skeleton';
import { AutoCompleteModule }    from 'primeng/autocomplete';

import { EventService }       from '../../service/event.service';
import { FileService }        from '../../service/file.service';
import { ParticipantService } from '../../service/participant.service';
import {
    Event, Participant,
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
        CommonModule, ReactiveFormsModule, FormsModule,
        ButtonModule, InputTextModule, TextareaModule,
        DatePickerModule, SelectModule, RadioButtonModule,
        CardModule, DividerModule, ToastModule,
        IconFieldModule, InputIconModule, TooltipModule,
        ProgressSpinnerModule, SkeletonModule, AutoCompleteModule
    ],
    providers: [MessageService],
    templateUrl: './event-create.html',
    styleUrl: './event-create.css'
})
export class EventCreateComponent implements OnInit {

    loading    = false;
    eventForm!: FormGroup;
    scheduleMode: 'global' | 'custom' = 'global';
    uploadedFiles: UploadedFile[] = [];
    currentStep = 0;

    typeOptions            = EVENT_TYPE_OPTIONS;
    statusOptions          = EVENT_STATUS_OPTIONS;
    participantTypeOptions = PARTICIPANT_TYPE_OPTIONS;

    today:      Date = new Date();
    minEndDate: Date = new Date();

    countries: any[] = [];
    cities:    any[] = [];
    selectedCountryCode = 'BF';

    participantSuggestions:      any[] = [];
    selectedExistingParticipant: any   = null;

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

    steps = [
        { number: 1, label: 'Informations générales', icon: 'pi-info-circle'  },
        { number: 2, label: 'Dates et Lieu',           icon: 'pi-calendar'    },
        { number: 3, label: 'Horaires',                icon: 'pi-clock'       },
        { number: 4, label: 'Participants',            icon: 'pi-users',       optional: true },
        { number: 5, label: 'Documents',               icon: 'pi-paperclip',   optional: true },
        { number: 6, label: 'Récapitulatif',           icon: 'pi-check-circle' }
    ];

    constructor(
        private fb:                 FormBuilder,
        private eventService:       EventService,
        private fileService:        FileService,
        private participantService: ParticipantService,
        private router:             Router,
        private messageService:     MessageService
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadCountries();
        this.loadCities('BF');
    }

    initForm(): void {
        this.eventForm = this.fb.group({
            title:           ['', [Validators.required, Validators.minLength(3)]],
            description:     [''],
            type:            ['', Validators.required],
            startDate:       ['', Validators.required],
            endDate:         ['', Validators.required],
            pays:            ['Burkina Faso'],
            ville:           ['Ouagadougou'],
            meetingLink:     [''],
            globalStartTime: ['09:00', Validators.required],
            globalEndTime:   ['17:00', Validators.required],
            schedules:       this.fb.array([]),
            participants:    this.fb.array([]),
            lieuType:        [''],
            salle:           [''],
            nomLieu:         ['']
        });

        this.eventForm.get('lieuType')?.valueChanges.subscribe(type => {
            this.eventForm.patchValue({
                salle:       '',
                ville:       '',
                pays:        '',
                nomLieu:     '',
                meetingLink: ''
            }, { emitEvent: false });

            if (type === 'NATIONAL') {
                this.loadCities('BF');
            }
        });
    }

    get currentLieuType(): string {
        return this.eventForm.get('lieuType')?.value || '';
    }

    get schedules(): FormArray {
        return this.eventForm.get('schedules') as FormArray;
    }

    get participants(): FormArray {
        return this.eventForm.get('participants') as FormArray;
    }

    onParticipantSearch(event: { query: string }): void {
        const q = event.query?.trim();
        if (!q) { this.participantSuggestions = []; return; }
        const addedEmails = new Set(
            (this.participants.controls as any[]).map(c => c.get('email')?.value)
        );
        this.participantService.autocompleteParticipants(q).subscribe({
            next: (results: Participant[]) => {
                this.participantSuggestions = results
                    .filter(p => !addedEmails.has(p.email))
                    .map(p => ({ ...p, displayName: `${p.firstName} ${p.lastName} (${p.email})` }));
            },
            error: () => { this.participantSuggestions = []; }
        });
    }

    loadCountries(): void {
        try {
            this.countries = Country.getAllCountries()
                .map(c => ({ label: c.name, value: c.name, code: c.isoCode }))
                .sort((a, b) => a.label.localeCompare(b.label));
        } catch (err) {
            console.error('Erreur chargement pays:', err);
        }
    }

    loadCities(countryCode: string): void {
        try {
            const data = City.getCitiesOfCountry(countryCode);
            this.cities = data && data.length > 0
                ? data.map(c => ({ label: c.name, value: c.name }))
                      .sort((a, b) => a.label.localeCompare(b.label))
                : [];
        } catch (err) {
            this.cities = [];
        }
    }

    onCountryChange(event: any): void {
        const country = this.countries.find(c => c.value === event.value);
        if (country) {
            this.selectedCountryCode = country.code;
            this.loadCities(country.code);
        } else {
            this.cities = [];
        }
        this.eventForm.get('ville')?.setValue('');
    }

    hasCities(): boolean { return this.cities.length > 0; }

    onStartDateChange(): void {
        const startDate = this.eventForm.get('startDate')?.value;
        if (!startDate) return;
        this.minEndDate = new Date(startDate);
        const endDate = this.eventForm.get('endDate')?.value;
        if (endDate && new Date(endDate) < new Date(startDate)) {
            this.eventForm.get('endDate')?.setValue(startDate);
            this.messageService.add({
                severity: 'info',
                summary: 'Date ajustée',
                detail: 'La date de fin a été ajustée automatiquement',
                life: 3000
            });
        }
    }

    endDateBeforeStartDate(): boolean {
        const s = this.eventForm.get('startDate')?.value;
        const e = this.eventForm.get('endDate')?.value;
        return !!(s && e && new Date(e) < new Date(s));
    }

    get progressValue(): number {
        return ((this.currentStep + 1) / 6) * 100;
    }

    getStepClass(i: number): string {
        if (i < this.currentStep)   return 'step-completed';
        if (i === this.currentStep) return 'step-active';
        return 'step-pending';
    }

    isStepClickable(i: number): boolean {
        return i < this.currentStep ||
               (i === this.currentStep + 1 &&
                this.canProceedFromStep(this.currentStep));
    }

    onStepClick(i: number): void {
        if (this.isStepClickable(i)) this.goToStep(i);
    }

    goToStep(step: number): void {
        if (step > this.currentStep &&
            !this.canProceedFromStep(this.currentStep)) {
            this.markStepFieldsAsTouched(this.currentStep);
            this.messageService.add({
                severity: 'warn',
                summary: 'Champs obligatoires manquants',
                detail: 'Veuillez remplir tous les champs requis avant de continuer',
                life: 4000
            });
            return;
        }
        this.currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    canProceedFromStep(stepIndex: number): boolean {
        switch (stepIndex) {
            case 0:
                return !!(this.eventForm.get('title')?.valid &&
                          this.eventForm.get('type')?.valid);
            case 1: {
                const s = this.eventForm.get('startDate')?.value;
                const e = this.eventForm.get('endDate')?.value;
                return !!(s && e && new Date(e) >= new Date(s));
            }
            case 2:
                return this.scheduleMode === 'global'
                    ? !!(this.eventForm.get('globalStartTime')?.valid &&
                         this.eventForm.get('globalEndTime')?.valid)
                    : this.schedules.length > 0 && this.schedules.valid;
            case 3:
            case 4:
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
                    this.schedules.controls.forEach(c =>
                        Object.keys(c.value).forEach(k =>
                            c.get(k)?.markAsTouched()));
                }
                break;
        }
    }

    onScheduleModeChange(mode: string): void {
        this.scheduleMode = mode as 'global' | 'custom';
        if (this.scheduleMode === 'custom' && this.schedules.length === 0) {
            this.addScheduleQuiet();
        }
    }

    private addScheduleQuiet(): void {
        this.schedules.push(this.fb.group({
            dateJour:  ['', Validators.required],
            startTime: ['09:00', Validators.required],
            endTime:   ['17:00', Validators.required],
            address:   ['']
        }));
    }

    addSchedule(): void {
        this.addScheduleQuiet();
        this.messageService.add({
            severity: 'success', summary: 'Ajouté',
            detail: 'Horaire ajouté avec succès', life: 2000
        });
    }

    removeSchedule(index: number): void {
        if (this.schedules.length > 1) {
            this.schedules.removeAt(index);
        }
    }

    addExistingParticipant(): void {
        if (!this.selectedExistingParticipant) return;

        const alreadyExists = this.participants.controls.some(c =>
            c.get('email')?.value === this.selectedExistingParticipant.email
        );

        if (alreadyExists) {
            this.messageService.add({
                severity: 'warn', summary: 'Déjà ajouté',
                detail: 'Ce participant est déjà dans la liste', life: 3000
            });
            return;
        }

        this.participants.push(this.fb.group({
            id:              [this.selectedExistingParticipant.id],
            firstName:       [this.selectedExistingParticipant.firstName, Validators.required],
            lastName:        [this.selectedExistingParticipant.lastName,  Validators.required],
            email:           [this.selectedExistingParticipant.email,     [Validators.required, Validators.email]],
            phoneNumber:     [this.selectedExistingParticipant.phoneNumber  || ''],
            structure:       [this.selectedExistingParticipant.structure    || ''],
            jobTitle:        [this.selectedExistingParticipant.jobTitle     || ''],
            participantType: [this.selectedExistingParticipant.participantType, Validators.required],
            isExisting:      [true]
        }));

        this.selectedExistingParticipant = null;
        this.messageService.add({
            severity: 'success', summary: 'Participant ajouté',
            detail: 'Participant existant ajouté à la liste', life: 2000
        });
        this.scrollToLastParticipant();
    }

    addNewParticipant(): void {
        this.participants.push(this.fb.group({
            id:              [null],
            firstName:       ['', Validators.required],
            lastName:        ['', Validators.required],
            email:           ['', [Validators.required, Validators.email]],
            phoneNumber:     [''],
            structure:       [''],
            jobTitle:        [''],
            participantType: ['INTERNE', Validators.required],
            isExisting:      [false]
        }));
        this.messageService.add({
            severity: 'success', summary: 'Formulaire ajouté',
            detail: 'Remplissez les champs obligatoires (*)', life: 4000
        });
        this.scrollToLastParticipant();
    }

    private scrollToLastParticipant(): void {
        setTimeout(() => {
            const cards = document.querySelectorAll('.participant-card');
            if (cards.length > 0) {
                cards[cards.length - 1].scrollIntoView({
                    behavior: 'smooth', block: 'center'
                });
            }
        }, 100);
    }

    removeParticipant(index: number): void {
        const name = this.participants.at(index).get('firstName')?.value || 'Participant';
        this.participants.removeAt(index);
        this.messageService.add({
            severity: 'error', summary: 'Supprimé',
            detail: `${name} supprimé de la liste`, life: 2000
        });
    }

    validateParticipants(): boolean {
        let invalid = 0;
        this.participants.controls.forEach(c => {
            Object.keys(c.value).forEach(k => c.get(k)?.markAsTouched());
            if (c.invalid) invalid++;
        });
        if (invalid > 0) {
            this.messageService.add({
                severity: 'warn', summary: 'Formulaires incomplets',
                detail: `${invalid} participant(s) avec des champs manquants`, life: 6000
            });
            return false;
        }
        return true;
    }

    onNextFromParticipants(): void {
        if (this.participants.length === 0 || this.validateParticipants()) {
            if (this.participants.length > 0) {
                this.messageService.add({
                    severity: 'success', summary: 'Participants validés',
                    detail: `${this.participants.length} participant(s) ajouté(s)`, life: 3000
                });
            }
            this.goToStep(4);
        }
    }

    isExistingParticipant(index: number): boolean {
        return this.participants.at(index)?.get('isExisting')?.value === true;
    }

    onFileSelect(event: any): void { this.handleFiles(event.target.files); }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer?.files) this.handleFiles(event.dataTransfer.files);
    }

    handleFiles(files: FileList): void {
        let added = 0;
        Array.from(files).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                this.messageService.add({
                    severity: 'warn', summary: 'Fichier trop volumineux',
                    detail: `${file.name} dépasse 10 MB`, life: 4000
                });
                return;
            }
            const uf: UploadedFile = { file };
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e: any) => { uf.preview = e.target.result; };
                reader.readAsDataURL(file);
            }
            this.uploadedFiles.push(uf);
            added++;
        });
        if (added > 0) {
            this.messageService.add({
                severity: 'success', summary: 'Ajouté',
                detail: `${added} fichier(s) ajouté(s)`, life: 3000
            });
        }
    }

    removeFile(index: number): void {
        const name = this.uploadedFiles[index].file.name;
        this.uploadedFiles.splice(index, 1);
        this.messageService.add({
            severity: 'error', summary: 'Supprimé',
            detail: `${name} retiré`, life: 2000
        });
    }

    getFileIcon(file: File): string {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();
        if (type.includes('pdf'))                              return 'pi pi-file-pdf text-red-500';
        if (type.includes('word') || name.match(/\.docx?$/))  return 'pi pi-file-word text-blue-500';
        if (type.includes('excel') || name.match(/\.xlsx?$/)) return 'pi pi-file-excel text-green-500';
        if (type.includes('image'))                            return 'pi pi-image text-purple-500';
        return 'pi pi-file text-gray-500';
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
               ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    }

    isFieldInvalid(fieldName: string): boolean {
        const f = this.eventForm.get(fieldName);
        return !!(f && f.invalid && f.touched);
    }

    getErrorMessage(controlName: string): string {
        const c = this.eventForm.get(controlName);
        if (c?.hasError('required'))  return 'Ce champ est requis';
        if (c?.hasError('email'))     return 'Email invalide';
        if (c?.hasError('minlength')) return 'Minimum 3 caractères';
        return '';
    }

    getTypeLabel(v: string): string {
        return this.typeOptions.find(o => o.value === v)?.label ?? 'Non défini';
    }

    getParticipantTypeLabel(v: string): string {
        return this.participantTypeOptions.find(o => o.value === v)?.label ?? 'Non défini';
    }

    formatDateDisplay(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    }

    calculateDuration(start: Date, end: Date): string {
        if (!start || !end) return 'Non calculable';
        const s = new Date(start); s.setHours(0,0,0,0);
        const e = new Date(end);   e.setHours(0,0,0,0);
        const days = Math.ceil(Math.abs(e.getTime() - s.getTime()) / 86400000) + 1;
        return days === 1 ? '1 jour' : `${days} jours`;
    }

    formatDate(date: Date): string {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    getLieuResume(): string {
        const fv   = this.eventForm.value;
        const type = fv.lieuType;
        if (!type) {
            if (fv.ville && fv.pays) return `${fv.ville}, ${fv.pays}`;
            if (fv.ville) return fv.ville;
            if (fv.pays)  return fv.pays;
            return 'Non défini';
        }
        switch (type) {
            case 'INTERNE':
                return fv.salle ? `ASCELC — ${fv.salle}` : 'ASCELC';
            case 'NATIONAL': {
                const parts = [fv.nomLieu, fv.ville].filter(Boolean);
                return parts.join(' — ') || 'Burkina Faso';
            }
            case 'INTERNATIONAL': {
                const parts = [fv.nomLieu, fv.ville, fv.pays].filter(Boolean);
                return parts.join(', ') || 'International';
            }
            case 'VIRTUEL':
                return fv.meetingLink
                    ? `Réunion en ligne — ${fv.meetingLink}`
                    : 'Réunion en ligne';
            default:
                return 'Non défini';
        }
    }

    // ==========================================
    // ✅ SOUMISSION — sans status (backend décide)
    // ==========================================
    async onSubmit(): Promise<void> {
        if (!this.canProceedFromStep(0) ||
            !this.canProceedFromStep(1) ||
            !this.canProceedFromStep(2)) {
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
            const fv = this.eventForm.value;

            // ✅ PAS de status ici — le backend détermine selon le rôle
            const eventData: any = {
                title:       fv.title?.trim(),
                description: fv.description?.trim() || null,
                type:        fv.type,
                startDate:   this.formatDate(fv.startDate),
                endDate:     this.formatDate(fv.endDate),
                pays:        fv.pays?.trim()        || null,
                ville:       fv.ville?.trim()       || null,
                meetingLink: fv.meetingLink?.trim() || null,
                lieuType:    fv.lieuType            || null,
                salle:       fv.salle?.trim()       || null,
                nomLieu:     fv.nomLieu?.trim()     || null,
            };

            // Horaires
            if (this.scheduleMode === 'global') {
                const st = fv.globalStartTime;
                const et = fv.globalEndTime;
                eventData.globalStartTime = st.length === 5 ? st + ':00' : st;
                eventData.globalEndTime   = et.length === 5 ? et + ':00' : et;
                eventData.schedules       = [];
            } else {
                eventData.schedules = fv.schedules
                    .filter((s: any) => s.dateJour)
                    .map((s: any) => {
                        const st = s.startTime;
                        const et = s.endTime;
                        return {
                            dateJour:  this.formatDate(s.dateJour),
                            startTime: st.length === 5 ? st + ':00' : st,
                            endTime:   et.length === 5 ? et + ':00' : et,
                            address:   s.address || fv.ville || null
                        };
                    });
            }

            // Participants
            if (fv.participants?.length > 0) {
                eventData.participants = fv.participants.map((p: any) => ({
                    id:              p.id              || null,
                    firstName:       p.firstName?.trim(),
                    lastName:        p.lastName?.trim(),
                    email:           p.email?.trim().toLowerCase(),
                    phoneNumber:     p.phoneNumber     || null,
                    structure:       p.structure       || null,
                    jobTitle:        p.jobTitle        || null,
                    participantType: p.participantType
                }));
            }

            console.log('Payload:', JSON.stringify(eventData, null, 2));

            const createdEvent = await this.eventService
                .createEvent(eventData).toPromise();

            if (createdEvent?.id && this.uploadedFiles.length > 0) {
                await this.uploadFiles(createdEvent.id);
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Evenement créé !',
                detail: 'Redirection en cours...',
                life: 3000
            });

            setTimeout(() => {
                this.router.navigate(['/events'], {
                    queryParams: {
                        created:   createdEvent?.id,
                        timestamp: Date.now()
                    }
                });
            }, 1500);

        } catch (error: any) {
            console.error('Erreur création:', error);
            this.loading = false;
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: error?.error?.message || error?.message || 'Erreur inconnue',
                life: 8000
            });
        }
    }

    async uploadFiles(eventId: string): Promise<void> {
        const promises = this.uploadedFiles.map(item => {
            const formData = new FormData();
            formData.append('file',    item.file);
            formData.append('eventId', eventId);
            return this.fileService.uploadFile(formData).toPromise();
        });
        await Promise.all(promises);
    }

    cancel(): void {
        if (confirm('Êtes-vous sûr de vouloir annuler ? Toutes les données seront perdues.')) {
            this.router.navigate(['/events']);
        }
    }
}