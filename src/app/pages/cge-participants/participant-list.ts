import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { MessageService, ConfirmationService } from 'primeng/api';
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
  styleUrls: ['./participant-list.css'],
  template: `
    <div class="participant-list-container">
      <p-toast />
      <p-confirmDialog />

      <!-- En-tête -->
      <div class="page-header">
        <div class="header-left">
          <h1>
            <i class="pi pi-users" aria-hidden="true"></i>
            Gestion des Participants
          </h1>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <!-- Toggle vue liste / cartes -->
          <div class="view-toggle">
            <button class="vt-btn" [class.vt-active]="viewMode === 'list'" (click)="viewMode = 'list'" title="Vue liste">
              <i class="pi pi-list"></i>
            </button>
            <button class="vt-btn" [class.vt-active]="viewMode === 'card'" (click)="viewMode = 'card'" title="Vue cartes">
              <i class="pi pi-th-large"></i>
            </button>
          </div>
          <p-button
            icon="pi pi-plus"
            label="Nouveau Participant"
            severity="success"
            (onClick)="showCreateDialog()"
          />
        </div>
      </div>

      <!-- Statistiques -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Participants</div>
          <div class="stat-value">{{ totalRecords }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Internes (page)</div>
          <div class="stat-value">{{ getInternalCount() }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Externes (page)</div>
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
        @if (loading && participants.length === 0) {
          <div class="text-center py-5">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--primary-color);" aria-hidden="true"></i>
          </div>
        } @else if (!loading && participants.length === 0) {
          <div class="empty-state">
            <i class="pi pi-users empty-state-icon" aria-hidden="true"></i>
            <div class="empty-state-title">Aucun participant trouvé</div>
            <p style="color: var(--text-color-secondary); font-size: 14px;">
              Cliquez sur "Nouveau Participant" pour en ajouter un
            </p>
          </div>
        } @else {

          <!-- ── Vue CARTE (mobile + desktop toggle) ────────── -->
          <div class="mobile-cards-list" [class.cards-desktop-grid]="viewMode === 'card'">
            @for (participant of participants; track participant.id) {
              <div class="participant-card-mobile">
                <div class="pcm-header">
                  <div class="pcm-avatar">
                    {{ participant.firstName?.charAt(0) }}{{ participant.lastName?.charAt(0) }}
                  </div>
                  <div class="pcm-name-block">
                    <div class="pcm-name">{{ participant.firstName }} {{ participant.lastName }}</div>
                    <span [class]="'participant-badge ' + (participant.participantType === 'INTERNE' ? 'badge-interne' : 'badge-externe')">
                      <i [class]="participant.participantType === 'INTERNE' ? 'pi pi-building' : 'pi pi-users'" aria-hidden="true"></i>
                      {{ participant.participantType === 'INTERNE' ? 'Interne' : 'Externe' }}
                    </span>
                  </div>
                  <div class="pcm-actions">
                    <p-button icon="pi pi-pencil" severity="info" [text]="true" [rounded]="true" (onClick)="editParticipant(participant)" />
                    <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="confirmDelete(participant)" />
                  </div>
                </div>
                <div class="pcm-body">
                  <div class="pcm-row">
                    <i class="pi pi-envelope pcm-icon"></i>
                    <span>{{ participant.email }}</span>
                  </div>
                  @if (participant.phoneNumber) {
                    <div class="pcm-row">
                      <i class="pi pi-phone pcm-icon"></i>
                      <span>{{ participant.phoneNumber }}</span>
                    </div>
                  }
                  @if (participant.structure) {
                    <div class="pcm-row">
                      <i class="pi pi-building pcm-icon"></i>
                      <span>{{ participant.structure }}</span>
                    </div>
                  }
                  @if (participant.jobTitle) {
                    <div class="pcm-row">
                      <i class="pi pi-briefcase pcm-icon"></i>
                      <span>{{ participant.jobTitle }}</span>
                    </div>
                  }
                </div>
              </div>
            }
            <!-- Pagination mobile -->
            <div class="mobile-pagination" *ngIf="totalRecords > 0">
              <button class="mob-pag-btn" [disabled]="currentPage === 0"
                      (click)="currentPage = currentPage - 1; loadPaged()">
                <i class="pi pi-chevron-left"></i>
              </button>
              <span class="mob-pag-info">
                Page {{ currentPage + 1 }} / {{ Math.ceil(totalRecords / pageSize) }}
                &nbsp;·&nbsp; {{ totalRecords }} participant(s)
              </span>
              <button class="mob-pag-btn"
                      [disabled]="(currentPage + 1) >= Math.ceil(totalRecords / pageSize)"
                      (click)="currentPage = currentPage + 1; loadPaged()">
                <i class="pi pi-chevron-right"></i>
              </button>
            </div>
          </div>

          <!-- ── Vue TABLEAU (desktop) ──────────────────────── -->
          <p-table
            class="desktop-table"
            [class.table-hidden-by-toggle]="viewMode === 'card'"
            [value]="participants"
            [lazy]="true"
            [totalRecords]="totalRecords"
            [loading]="loading"
            [paginator]="true"
            [rows]="pageSize"
            [rowsPerPageOptions]="[10, 20, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} participants"
            (onLazyLoad)="onLazyLoad($event)"
          >
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="lastName">Nom Complet <p-sortIcon field="lastName" /></th>
                <th>Email</th>
                <th>Téléphone</th>
                <th pSortableColumn="structure">Structure <p-sortIcon field="structure" /></th>
                <th>Fonction</th>
                <th pSortableColumn="participantType">Type <p-sortIcon field="participantType" /></th>
                <th style="width: 150px;">Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-participant>
              <tr>
                <td><strong>{{ participant.firstName }} {{ participant.lastName }}</strong></td>
                <td><i class="pi pi-envelope mr-2" style="color:var(--text-color-secondary)"></i>{{ participant.email }}</td>
                <td><i class="pi pi-phone mr-2" style="color:var(--text-color-secondary)"></i>{{ participant.phoneNumber || '-' }}</td>
                <td>{{ participant.structure || '-' }}</td>
                <td>{{ participant.jobTitle || '-' }}</td>
                <td>
                  <span [class]="'participant-badge ' + (participant.participantType === 'INTERNE' ? 'badge-interne' : 'badge-externe')">
                    <i [class]="participant.participantType === 'INTERNE' ? 'pi pi-building' : 'pi pi-users'" aria-hidden="true"></i>
                    {{ participant.participantType === 'INTERNE' ? 'Interne' : 'Externe' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <p-button icon="pi pi-pencil" severity="info" [text]="true" [rounded]="true" (onClick)="editParticipant(participant)" pTooltip="Modifier" />
                    <p-button icon="pi pi-eye" severity="secondary" [text]="true" [rounded]="true" (onClick)="viewParticipant(participant)" pTooltip="Détails" />
                    <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="confirmDelete(participant)" pTooltip="Supprimer" />
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
                <i class="pi pi-user" aria-hidden="true"></i>
                <span>Identité</span>
              </div>

              <div class="form-row">
                <div class="form-col">
                  <label for="firstName" class="field-label">
                    Prénom <span class="text-red-500">*</span>
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
                    Nom <span class="text-red-500">*</span>
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
                <i class="pi pi-envelope" aria-hidden="true"></i>
                <span>Contact</span>
              </div>

              <div class="form-row">
                <div class="form-col">
                  <label for="email" class="field-label">
                    Email <span class="text-red-500">*</span>
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
                <i class="pi pi-briefcase" aria-hidden="true"></i>
                <span>Informations professionnelles</span>
              </div>

              <div class="form-row">
                <div class="form-col">
                  <label for="structure" class="field-label">
                    Structure <span class="text-red-500">*</span>
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
                <div class="form-col-full">
                  <label for="participantType" class="field-label">
                    Type de participant <span class="text-red-500">*</span>
                  </label>
                  <p-select
                    id="participantType"
                    [options]="typeOptions"
                    formControlName="participantType"
                    placeholder="Sélectionnez un type"
                    styleClass="w-full"
                    appendTo="body"
                    optionLabel="label"
                    optionValue="value"
                  />
                  @if (participantForm.get('participantType')?.invalid && participantForm.get('participantType')?.touched) {
                    <small class="p-error">Le type est obligatoire</small>
                  }
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
export class ParticipantListComponent implements OnInit, OnDestroy {
  readonly Math = Math;
  viewMode: 'list' | 'card' = 'card';
  participants: any[] = [];
  totalRecords = 0;
  pageSize = 10;
  currentPage = 0;
  sortField = 'lastName';
  sortDirection = 'asc';

  loading = false;
  saving = false;

  displayDialog = false;
  editMode = false;
  participantForm!: FormGroup;

  searchText = '';
  selectedType: string | null = null;

  private searchTimer: any;

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
    this.loadPaged();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  initForm(): void {
    this.participantForm = this.fb.group({
      id: [null],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      structure: ['', Validators.required],
      jobTitle: [''],
      participantType: ['', Validators.required]
    });
  }

  loadPaged(): void {
    this.loading = true;
    this.participantService.getParticipantsPaged(
      this.currentPage,
      this.pageSize,
      this.sortField,
      this.sortDirection,
      this.searchText.trim() || undefined,
      this.selectedType || undefined
    ).subscribe({
      next: (page) => {
        this.participants = page.content;
        this.totalRecords = page.totalElements;
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

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.currentPage = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize));
    this.pageSize = event.rows ?? this.pageSize;
    if (event.sortField) {
      this.sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
      this.sortDirection = event.sortOrder === -1 ? 'desc' : 'asc';
    }
    this.loadPaged();
  }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 0;
      this.loadPaged();
    }, 400);
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadPaged();
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedType = null;
    this.currentPage = 0;
    this.loadPaged();
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
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Participant ${this.editMode ? 'modifié' : 'créé'} avec succès`
        });
        this.loadPaged();
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
        this.loadPaged();
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

  getInternalCount(): number {
    return this.participants.filter(p => p.participantType === 'INTERNE').length;
  }

  getExternalCount(): number {
    return this.participants.filter(p => p.participantType === 'EXTERNE').length;
  }
}
