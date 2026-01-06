import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
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
      background: #f8f9fa;
      min-height: 100vh;
    }

    .page-header {
      background: white;
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
      color: #228B22;
    }

    .header-left h1 i {
      font-size: 32px;
    }

    .filters-section {
      background: white;
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
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .btn-ascelc {
      background: #228B22 !important;
      color: white !important;
      font-weight: 700 !important;
      padding: 12px 24px !important;
      border-radius: 8px !important;
      border: none !important;
      box-shadow: 0 4px 12px rgba(34, 139, 34, 0.3) !important;
      transition: all 0.3s !important;
    }

    .btn-ascelc:hover:not(:disabled) {
      background: #1a6b1a !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 16px rgba(34, 139, 34, 0.4) !important;
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
      background: #E8F5E9;
      color: #228B22;
    }

    .badge-externe {
      background: #FFF3E0;
      color: #F57C00;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #228B22;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #228B22;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-state-icon {
      font-size: 64px;
      color: #d0d0d0;
      margin-bottom: 16px;
    }

    .empty-state-title {
      font-size: 18px;
      font-weight: 600;
      color: #666;
      margin-bottom: 8px;
    }

    .form-field {
      margin-bottom: 20px;
    }

    .field-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .required {
      color: #dc3545;
      font-weight: 700;
      margin-left: 2px;
    }

    .field-error {
      display: block;
      color: #dc3545;
      font-size: 12px;
      font-weight: 500;
      margin-top: 4px;
    }

    :host ::ng-deep {
      .p-datatable .p-datatable-thead > tr > th {
        background: #228B22;
        color: white;
        font-weight: 600;
        padding: 12px;
      }

      .p-datatable .p-datatable-tbody > tr > td {
        padding: 12px;
      }

      .p-datatable .p-datatable-tbody > tr:hover {
        background: #f8f9fa;
      }

      .p-inputtext {
        font-size: 14px;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        transition: all 0.3s;
      }

      .p-inputtext:focus {
        border-color: #228B22;
        box-shadow: 0 0 0 3px rgba(34, 139, 34, 0.1);
      }

      .p-select {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
      }

      .p-select:focus {
        border-color: #228B22;
        box-shadow: 0 0 0 3px rgba(34, 139, 34, 0.1);
      }
    }

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
          styleClass="btn-ascelc"
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
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #228B22;"></i>
          </div>
        } @else if (filteredParticipants.length === 0) {
          <div class="empty-state">
            <i class="pi pi-users empty-state-icon"></i>
            <div class="empty-state-title">Aucun participant trouvé</div>
            <p style="color: #999; font-size: 14px;">
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
            [globalFilterFields]="['firstName', 'lastName', 'email', 'organization']"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Nom Complet</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Organisation</th>
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
                  <i class="pi pi-envelope mr-2" style="color: #666;"></i>
                  {{ participant.email }}
                </td>
                <td>
                  <i class="pi pi-phone mr-2" style="color: #666;"></i>
                  {{ participant.phoneNumber || '-' }}
                </td>
                <td>{{ participant.organization || '-' }}</td>
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
        [style]="{ width: '600px' }"
        [header]="editMode ? 'Modifier le participant' : 'Nouveau participant'"
      >
        <form [formGroup]="participantForm">
          <div class="grid">
            <div class="col-6">
              <div class="form-field">
                <label for="lastName" class="field-label">
                  Nom <span class="required">*</span>
                </label>
                <input
                  pInputText
                  id="lastName"
                  formControlName="lastName"
                  placeholder="Nom de famille"
                  class="w-full"
                />
                @if (participantForm.get('lastName')?.invalid && participantForm.get('lastName')?.touched) {
                  <small class="field-error">Le nom est obligatoire</small>
                }
              </div>
            </div>

            <div class="col-6">
              <div class="form-field">
                <label for="firstName" class="field-label">
                  Prénom <span class="required">*</span>
                </label>
                <input
                  pInputText
                  id="firstName"
                  formControlName="firstName"
                  placeholder="Prénom"
                  class="w-full"
                />
                @if (participantForm.get('firstName')?.invalid && participantForm.get('firstName')?.touched) {
                  <small class="field-error">Le prénom est obligatoire</small>
                }
              </div>
            </div>

            <div class="col-12">
              <div class="form-field">
                <label for="email" class="field-label">
                  Email <span class="required">*</span>
                </label>
                <input
                  pInputText
                  id="email"
                  formControlName="email"
                  type="email"
                  placeholder="email@exemple.com"
                  class="w-full"
                />
                @if (participantForm.get('email')?.invalid && participantForm.get('email')?.touched) {
                  <small class="field-error">Email valide requis</small>
                }
              </div>
            </div>

            <div class="col-6">
              <div class="form-field">
                <label for="phoneNumber" class="field-label">Téléphone</label>
                <input
                  pInputText
                  id="phoneNumber"
                  formControlName="phoneNumber"
                  placeholder="+226 XX XX XX XX"
                  class="w-full"
                />
              </div>
            </div>

            <div class="col-6">
              <div class="form-field">
                <label for="participantType" class="field-label">
                  Type <span class="required">*</span>
                </label>
                <p-select
                  [options]="typeOptions"
                  formControlName="participantType"
                  placeholder="Sélectionnez"
                  styleClass="w-full"
                />
              </div>
            </div>

            <div class="col-12">
              <div class="form-field">
                <label for="organization" class="field-label">Organisation</label>
                <input
                  pInputText
                  id="organization"
                  formControlName="organization"
                  placeholder="Nom de l'organisation"
                  class="w-full"
                />
              </div>
            </div>

            <div class="col-12">
              <div class="form-field">
                <label for="jobTitle" class="field-label">Fonction</label>
                <input
                  pInputText
                  id="jobTitle"
                  formControlName="jobTitle"
                  placeholder="Poste occupé"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </form>

        <ng-template pTemplate="footer">
          <p-button
            label="Annuler"
            severity="secondary"
            [text]="true"
            (onClick)="displayDialog = false"
          />
          <p-button
            [label]="editMode ? 'Modifier' : 'Créer'"
            styleClass="btn-ascelc"
            (onClick)="saveParticipant()"
            [disabled]="participantForm.invalid || saving"
            [loading]="saving"
          />
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
      organization: [''],
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
        
        this.participants = [
          savedParticipant,
          ...this.participants.filter(p => p.id !== savedParticipant.id)
        ];
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