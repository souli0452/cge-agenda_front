import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services & Models
import { ParticipantService } from '../../service/participant.service';
import { Participant } from '../../models';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, 
    Button,
    InputText,
    TableModule,
    Toast,
    ConfirmDialog,
    Dialog,
    Select,
    IconField,
    InputIcon
  ],
  providers: [MessageService, ConfirmationService],
  styles: [`
    .participant-list-container {
      padding: 24px;
      background: var(--surface-ground);
      min-height: 100vh;
    }

    .page-header {
      background: var(--surface-card);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color);
    }

    .header-left h1 i {
      font-size: 32px;
    }

    .filters-section {
      background: var(--surface-card);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 16px;
      align-items: end;
    }

    .table-container {
      background: var(--surface-card);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--surface-card);
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-left: 4px solid var(--primary-color);
      transition: all 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color);
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-state-icon {
      font-size: 64px;
      color: var(--surface-300);
      margin-bottom: 16px;
    }

    .empty-state-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-color-secondary);
      margin-bottom: 8px;
    }

    .participant-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-interne {
      background: var(--green-50);
      color: var(--green-600);
    }

    .badge-externe {
      background: var(--orange-50);
      color: var(--orange-600);
    }

    /* Dialog Styles */
    .dialog-content {
      padding: 8px 0;
    }

    .form-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--surface-border);
    }

    .form-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--primary-color);
    }

    .section-header i {
      font-size: 18px;
    }

    /* Form Layout - 2 COLONNES */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;
    }

    .form-row:last-child {
      margin-bottom: 0;
    }

    .form-col {
      display: flex;
      flex-direction: column;
    }

    .form-col-full {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
    }

    .field-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-color);
      margin-bottom: 8px;
    }

    .required {
      color: var(--red-500);
      font-weight: 700;
      margin-left: 2px;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .filters-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .form-col-full {
        grid-column: 1;
      }
    }

    :host ::ng-deep {
      .p-datatable .p-datatable-thead > tr > th {
        background: var(--primary-color);
        color: white;
        font-weight: 600;
        padding: 12px;
      }

      .p-datatable .p-datatable-tbody > tr > td {
        padding: 12px;
      }

      .p-datatable .p-datatable-tbody > tr:hover {
        background: var(--surface-hover);
      }

      /* Dialog Styles */
      .p-dialog-header {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
        border-bottom: none;
        padding: 1.25rem 1.5rem;
        color: white;
      }

      .p-dialog-title {
        font-size: 20px;
        font-weight: 700;
        color: white;
      }

      .p-dialog-content {
        padding: 1.25rem 1.5rem;
        background: var(--surface-0);
      }

      .p-dialog-footer {
        padding: 1rem 1.5rem;
        background: var(--surface-50);
        border-top: 1px solid var(--surface-border);
      }

      /* Input Styles */
      .p-inputtext {
        width: 100%;
        padding: 12px 14px;
        border-radius: 8px;
        border: 2px solid var(--surface-border);
        font-size: 14px;
        transition: all 0.3s;
        background: var(--surface-0);
      }

      .p-inputtext:enabled:hover {
        border-color: var(--primary-300);
        background: var(--surface-50);
      }

      .p-inputtext:enabled:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 0.2rem var(--primary-100);
        background: white;
      }

      .p-inputtext.ng-invalid.ng-touched {
        border-color: var(--red-500);
        background: var(--red-50);
      }

      /* Select Styles */
      .p-select {
        width: 100%;
        border-radius: 8px;
        border: 2px solid var(--surface-border);
        min-height: 46px;
      }

      .p-select .p-select-label {
        padding: 12px 14px;
        font-size: 14px;
      }

      .p-select:not(.p-disabled):hover {
        border-color: var(--primary-300);
        background: var(--surface-50);
      }

      .p-select:not(.p-disabled).p-focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 0.2rem var(--primary-100);
        background: white;
      }

      /* Error Messages */
      .p-error {
        color: var(--red-500);
        font-size: 12px;
        font-weight: 500;
        margin-top: 4px;
        display: block;
      }

      /* ✅ BUTTON STYLES FIXES - Empêche le bouton de disparaître au hover */
      .p-button {
        transition: all 0.2s ease-in-out;
      }

      .p-button-success {
        background: #22C55E !important;
        border-color: #22C55E !important;
        color: white !important;
      }

      .p-button-success:enabled:hover {
        background: #16A34A !important;
        border-color: #16A34A !important;
        color: white !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4) !important;
      }

      .p-button-success:enabled:active {
        background: #15803D !important;
        border-color: #15803D !important;
        transform: translateY(0);
      }

      .p-button-success:focus {
        box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.5) !important;
      }

      /* Boutons secondaires */
      .p-button-secondary {
        color: var(--text-color) !important;
        background: transparent !important;
        border-color: var(--surface-border) !important;
      }

      .p-button-secondary:enabled:hover {
        background: var(--surface-100) !important;
        border-color: var(--surface-300) !important;
        color: var(--text-color) !important;
      }

      /* Boutons texte dans dialog */
      .p-dialog .p-button-text {
        color: var(--text-color-secondary) !important;
        background: transparent !important;
      }

      .p-dialog .p-button-text:enabled:hover {
        background: var(--surface-hover) !important;
        color: var(--text-color) !important;
      }

      /* Boutons dans table (icônes) */
      .p-button-info.p-button-text {
        color: var(--blue-500) !important;
      }

      .p-button-info.p-button-text:enabled:hover {
        background: var(--blue-50) !important;
        color: var(--blue-600) !important;
      }

      .p-button-danger.p-button-text {
        color: var(--red-500) !important;
      }

      .p-button-danger.p-button-text:enabled:hover {
        background: var(--red-50) !important;
        color: var(--red-600) !important;
      }

      .p-button-secondary.p-button-text {
        color: var(--text-color-secondary) !important;
      }

      .p-button-secondary.p-button-text:enabled:hover {
        background: var(--surface-100) !important;
        color: var(--text-color) !important;
      }
    }
  `],
  template: `
    <div class="participant-list-container">
      <p-toast />
      <p-confirmDialog />

      <!-- En-tête -->
      <div class="page-header">
        <div class="header-left">
          <h1>
            <i class="pi pi-users"></i>
            Gestion des Participants
          </h1>
        </div>
        <p-button
          icon="pi pi-plus"
          label="Nouveau Participant"
          severity="success"
          (onClick)="showCreateDialog()"
        />
      </div>

      <!-- Statistiques -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Participants</div>
          <div class="stat-value">{{ participants.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Internes</div>
          <div class="stat-value">{{ getInternalCount() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Externes</div>
          <div class="stat-value">{{ getExternalCount() }}</div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-section">
        <div class="filters-grid">
          <p-iconfield iconPosition="left">
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="text"
              placeholder="Rechercher par nom, email..."
              [(ngModel)]="searchText"
              (input)="onSearch()"
              class="w-full"
            />
          </p-iconfield>

          <p-select
            [options]="typeOptions"
            [(ngModel)]="selectedType"
            (onChange)="onFilterChange()"
            placeholder="Tous les types"
            [showClear]="true"
            styleClass="w-full"
          />

          <p-button
            icon="pi pi-filter-slash"
            label="Réinitialiser"
            severity="secondary"
            [outlined]="true"
            (onClick)="resetFilters()"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        @if (loading) {
          <div class="text-center py-5">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--primary-color);"></i>
          </div>
        } @else if (filteredParticipants.length === 0) {
          <div class="empty-state">
            <i class="pi pi-users empty-state-icon"></i>
            <div class="empty-state-title">Aucun participant trouvé</div>
            <p style="color: var(--text-color-secondary); font-size: 14px;">
              Cliquez sur "Nouveau Participant" pour en ajouter un
            </p>
          </div>
        } @else {
          <p-table
            [value]="filteredParticipants"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} participants"
            [globalFilterFields]="['firstName', 'lastName', 'email', 'structure']"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Nom Complet</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Structure</th>
                <th>Fonction</th>
                <th>Type</th>
                <th style="width: 150px;">Actions</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-participant>
              <tr>
                <td>
                  <strong>{{ participant.firstName }} {{ participant.lastName }}</strong>
                </td>
                <td>
                  <i class="pi pi-envelope mr-2" style="color: var(--text-color-secondary);"></i>
                  {{ participant.email }}
                </td>
                <td>
                  <i class="pi pi-phone mr-2" style="color: var(--text-color-secondary);"></i>
                  {{ participant.phoneNumber || '-' }}
                </td>
                <td>{{ participant.structure || '-' }}</td>
                <td>{{ participant.jobTitle || '-' }}</td>
                <td>
                  <span
                    [class]="'participant-badge ' + (participant.participantType === 'INTERNE' ? 'badge-interne' : 'badge-externe')"
                  >
                    <i [class]="participant.participantType === 'INTERNE' ? 'pi pi-building' : 'pi pi-users'"></i>
                    {{ participant.participantType === 'INTERNE' ? 'Interne' : 'Externe' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <p-button
                      icon="pi pi-pencil"
                      severity="info"
                      [text]="true"
                      [rounded]="true"
                      (onClick)="editParticipant(participant)"
                      pTooltip="Modifier"
                    />
                    <p-button
                      icon="pi pi-eye"
                      severity="secondary"
                      [text]="true"
                      [rounded]="true"
                      (onClick)="viewParticipant(participant)"
                      pTooltip="Détails"
                    />
                    <p-button
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                      [rounded]="true"
                      (onClick)="confirmDelete(participant)"
                      pTooltip="Supprimer"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </div>

      <!-- Dialog Création/Edition -->
      <p-dialog
        [(visible)]="displayDialog"
        [modal]="true"
        [style]="{ width: '950px' }"
        [header]="editMode ? 'Modifier le participant' : 'Nouveau participant'"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="dialog-content">
          <form [formGroup]="participantForm">
            
            <!-- Section Identité -->
            <div class="form-section">
              <div class="section-header">
                <i class="pi pi-user"></i>
                <span>Identité</span>
              </div>
              
              <div class="form-row">
                <div class="form-col">
                  <label for="firstName" class="field-label">
                    Prénom <span class="required">*</span>
                  </label>
                  <input
                    pInputText
                    id="firstName"
                    formControlName="firstName"
                    placeholder="Prénom"
                  />
                  @if (participantForm.get('firstName')?.invalid && participantForm.get('firstName')?.touched) {
                    <small class="p-error">Le prénom est obligatoire</small>
                  }
                </div>

                <div class="form-col">
                  <label for="lastName" class="field-label">
                    Nom <span class="required">*</span>
                  </label>
                  <input
                    pInputText
                    id="lastName"
                    formControlName="lastName"
                    placeholder="Nom de famille"
                  />
                  @if (participantForm.get('lastName')?.invalid && participantForm.get('lastName')?.touched) {
                    <small class="p-error">Le nom est obligatoire</small>
                  }
                </div>
              </div>
            </div>

            <!-- Section Contact -->
            <div class="form-section">
              <div class="section-header">
                <i class="pi pi-envelope"></i>
                <span>Contact</span>
              </div>
              
              <div class="form-row">
                <div class="form-col">
                  <label for="email" class="field-label">
                    Email <span class="required">*</span>
                  </label>
                  <input
                    pInputText
                    id="email"
                    formControlName="email"
                    type="email"
                    placeholder="email@exemple.com"
                  />
                  @if (participantForm.get('email')?.invalid && participantForm.get('email')?.touched) {
                    <small class="p-error">Email valide requis</small>
                  }
                </div>

                <div class="form-col">
                  <label for="phoneNumber" class="field-label">Téléphone</label>
                  <input
                    pInputText
                    id="phoneNumber"
                    formControlName="phoneNumber"
                    placeholder="+226 XX XX XX XX"
                  />
                </div>
              </div>
            </div>

            <!-- Section Professionnelle -->
            <div class="form-section">
              <div class="section-header">
                <i class="pi pi-briefcase"></i>
                <span>Informations professionnelles</span>
              </div>
              
              <div class="form-row">
                <div class="form-col">
                  <label for="structure" class="field-label">
                    Structure <span class="required">*</span>
                  </label>
                  <input
                    pInputText
                    id="structure"
                    formControlName="structure"
                    placeholder="Nom de la structure"
                  />
                  @if (participantForm.get('structure')?.invalid && participantForm.get('structure')?.touched) {
                    <small class="p-error">La structure est obligatoire</small>
                  }
                </div>

                <div class="form-col">
                  <label for="jobTitle" class="field-label">Fonction</label>
                  <input
                    pInputText
                    id="jobTitle"
                    formControlName="jobTitle"
                    placeholder="Poste occupé"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-col">
                  <label for="participantType" class="field-label">
                    Type de participant <span class="required">*</span>
                  </label>
                  <p-select
                    id="participantType"
                    [options]="typeOptions"
                    formControlName="participantType"
                    placeholder="Sélectionnez un type"
                  />
                  @if (participantForm.get('participantType')?.invalid && participantForm.get('participantType')?.touched) {
                    <small class="p-error">Le type est obligatoire</small>
                  }
                </div>
                <div class="form-col">
                  <!-- Colonne vide pour alignement -->
                </div>
              </div>
            </div>

          </form>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <p-button
              label="Annuler"
              icon="pi pi-times"
              severity="secondary"
              [text]="true"
              (onClick)="displayDialog = false"
            />
            <p-button
              [label]="editMode ? 'Enregistrer' : 'Créer'"
              [icon]="editMode ? 'pi pi-check' : 'pi pi-plus'"
              severity="success"
              (onClick)="saveParticipant()"
              [disabled]="participantForm.invalid || saving"
              [loading]="saving"
            />
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `
})
export class ParticipantListComponent implements OnInit {
  participants: any[] = [];
  filteredParticipants: any[] = [];
  loading = false;
  saving = false;
  
  displayDialog = false;
  editMode = false;
  participantForm!: FormGroup;

  searchText = '';
  selectedType: string | null = null;

  typeOptions = [
    { label: 'Interne', value: 'INTERNE' },
    { label: 'Externe', value: 'EXTERNE' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private participantService: ParticipantService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadParticipants();
  }

  initForm(): void {
    this.participantForm = this.fb.group({
      id: [null],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      structure: ['',Validators.required],
      jobTitle: [''],
      participantType: ['', Validators.required]
    });
  }

  loadParticipants(): void {
    this.loading = true;
    this.participantService.getAllParticipants().subscribe({
      next: (data) => {
        this.participants = data;
        this.filteredParticipants = data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les participants'
        });
        this.loading = false;
      }
    });
  }

  showCreateDialog(): void {
    this.editMode = false;
    this.participantForm.reset();
    this.displayDialog = true;
  }

  editParticipant(participant: any): void {
    this.editMode = true;
    this.participantForm.patchValue(participant);
    this.displayDialog = true;
  }

  saveParticipant(): void {
    if (this.participantForm.invalid) {
      this.participantForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const participant = this.participantForm.value;

    const request = this.editMode
      ? this.participantService.updateParticipant(participant.id, participant)
      : this.participantService.createParticipant(participant);

    request.subscribe({
      next: (savedParticipant) => { 
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Participant ${this.editMode ? 'modifié' : 'créé'} avec succès`
        });

        if (this.editMode) {
          const index = this.participants.findIndex(p => p.id === savedParticipant.id);
          if (index !== -1) {
            this.participants[index] = savedParticipant;
          }
        } else {
          this.participants = [savedParticipant, ...this.participants];
        }

        this.applyFilters();
        this.displayDialog = false;
        this.saving = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.error?.message || 'Une erreur est survenue'
        });
        this.saving = false;
      }
    });
  }

  confirmDelete(participant: any): void {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer ${participant.firstName} ${participant.lastName} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui, supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.deleteParticipant(participant.id)
    });
  }

  deleteParticipant(id: string): void {
    this.participantService.deleteParticipant(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Participant supprimé avec succès'
        });
        this.loadParticipants();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de supprimer le participant'
        });
      }
    });
  }

  viewParticipant(participant: any): void {
    this.router.navigate(['/participants', participant.id]);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredParticipants = this.participants.filter(p => {
      const matchesSearch = !this.searchText ||
        p.firstName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.lastName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.email.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesType = !this.selectedType || p.participantType === this.selectedType;

      return matchesSearch && matchesType;
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedType = null;
    this.filteredParticipants = this.participants;
  }

  getInternalCount(): number {
    return this.participants.filter(p => p.participantType === 'INTERNE').length;
  }

  getExternalCount(): number {
    return this.participants.filter(p => p.participantType === 'EXTERNE').length;
  }
}
