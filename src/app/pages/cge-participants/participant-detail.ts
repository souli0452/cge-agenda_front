import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Table, TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';


// Services
import { ParticipantService } from '../../service/participant.service';

@Component({
  selector: 'app-participant-detail',
  standalone: true,
  imports: [
    CommonModule,
    Button,
    Skeleton,
    Tag,
    TableModule,
    Toast,
  ],
  providers: [MessageService],
  styles: [`
    .participant-detail-container {
      padding: 24px;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .back-button {
      margin-bottom: 16px;
    }

    .detail-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 24px;
    }

    .card-header {
      background: linear-gradient(135deg, #228B22 0%, #1a6b1a 100%);
      color: white;
      padding: 24px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .participant-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 700;
      color: #228B22;
      margin-right: 20px;
    }

    .participant-info {
      flex: 1;
    }

    .participant-name {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .participant-type {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }

    .card-body {
      padding: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-value i {
      color: #228B22;
      font-size: 18px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #228B22;
      margin: 0 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 3px solid #228B22;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title i {
      font-size: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #228B22;
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #228B22;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: 16px;
      display: block;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .btn-ascelc {
      background: #228B22 !important;
      color: white !important;
      font-weight: 700 !important;
      padding: 10px 20px !important;
      border-radius: 8px !important;
      border: none !important;
    }

    .btn-ascelc:hover {
      background: #1a6b1a !important;
    }

    :host ::ng-deep {
      .p-datatable .p-datatable-thead > tr > th {
        background: #228B22;
        color: white;
        font-weight: 600;
      }

      .p-datatable .p-datatable-tbody > tr:hover {
        background: #f8f9fa;
      }
    }

    @media (max-width: 768px) {
      .card-header {
        flex-direction: column;
        text-align: center;
      }

      .participant-avatar {
        margin: 0 0 16px 0;
      }

      .action-buttons {
        flex-direction: column;
        width: 100%;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  template: `
    <div class="participant-detail-container">
      <p-toast />

      <!-- Bouton Retour -->
      <div class="back-button">
        <p-button
          icon="pi pi-arrow-left"
          label="Retour"
          severity="secondary"
          [outlined]="true"
          (onClick)="goBack()"
        />
      </div>

      @if (loading) {
        <div class="detail-card">
          <div class="card-body">
            <p-skeleton width="100%" height="150px" styleClass="mb-3" />
            <p-skeleton width="100%" height="300px" />
          </div>
        </div>
      } @else if (participant) {
        <!-- Carte Principale -->
        <div class="detail-card">
          <div class="card-header">
            <div style="display: flex; align-items: center; flex: 1;">
              <div class="participant-avatar">
                {{ getInitials() }}
              </div>
              <div class="participant-info">
                <h1 class="participant-name">
                  {{ participant.firstName }} {{ participant.lastName }}
                </h1>
                <span class="participant-type">
                  <i [class]="participant.participantType === 'INTERNE' ? 'pi pi-building' : 'pi pi-users'"></i>
                  {{ participant.participantType === 'INTERNE' ? 'Participant Interne' : 'Participant Externe' }}
                </span>
              </div>
            </div>
            <div class="action-buttons">
              <p-button
                icon="pi pi-pencil"
                label="Modifier"
                severity="info"
                [outlined]="true"
                (onClick)="editParticipant()"
              />
            </div>
          </div>

          <div class="card-body">
            <h3 class="section-title">
              <i class="pi pi-info-circle"></i>
              Informations de Contact
            </h3>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Email</span>
                <div class="info-value">
                  <i class="pi pi-envelope"></i>
                  <a [href]="'mailto:' + participant.email" style="color: #228B22; text-decoration: none;">
                    {{ participant.email }}
                  </a>
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Téléphone</span>
                <div class="info-value">
                  <i class="pi pi-phone"></i>
                  <a [href]="'tel:' + participant.phoneNumber" style="color: #333; text-decoration: none;">
                    {{ participant.phoneNumber || 'Non renseigné' }}
                  </a>
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Organisation</span>
                <div class="info-value">
                  <i class="pi pi-building"></i>
                  {{ participant.organization || 'Non renseignée' }}
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Fonction</span>
                <div class="info-value">
                  <i class="pi pi-briefcase"></i>
                  {{ participant.jobTitle || 'Non renseignée' }}
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Date de Création</span>
                <div class="info-value">
                  <i class="pi pi-calendar"></i>
                  {{ participant.createdAt | date: 'dd/MM/yyyy à HH:mm' }}
                </div>
              </div>

              <div class="info-item">
                <span class="info-label">Dernière Modification</span>
                <div class="info-value">
                  <i class="pi pi-clock"></i>
                  {{ participant.updatedAt | date: 'dd/MM/yyyy à HH:mm' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="detail-card">
          <div class="card-body">
            <h3 class="section-title">
              <i class="pi pi-chart-bar"></i>
              Statistiques de Participation
            </h3>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{{ participationStats.totalEvents }}</div>
                <div class="stat-label">Événements Total</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ participationStats.upcomingEvents }}</div>
                <div class="stat-label">À Venir</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ participationStats.pastEvents }}</div>
                <div class="stat-label">Passés</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historique des Événements -->
        <div class="detail-card">
          <div class="card-body">
            <h3 class="section-title">
              <i class="pi pi-calendar"></i>
              Historique des Événements
            </h3>

            @if (events.length === 0) {
              <div class="empty-state">
                <i class="pi pi-calendar-times"></i>
                <p>Aucun événement pour ce participant</p>
              </div>
            } @else {
              <p-table
                [value]="events"
                [paginator]="true"
                [rows]="5"
                [rowsPerPageOptions]="[5, 10, 20]"
              >
                <ng-template pTemplate="header">
                  <tr>
                    <th>Titre</th>
                    <th>Type</th>
                    <th>Date Début</th>
                    <th>Date Fin</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-event>
                  <tr>
                    <td><strong>{{ event.title }}</strong></td>
                    <td>{{ event.type }}</td>
                    <td>{{ event.startDate | date: 'dd/MM/yyyy' }}</td>
                    <td>{{ event.endDate | date: 'dd/MM/yyyy' }}</td>
                    <td>
                      <p-tag
                        [value]="event.status"
                        [severity]="getStatusSeverity(event.status)"
                      />
                    </td>
                    <td>
                      <p-button
                        icon="pi pi-eye"
                        severity="info"
                        [text]="true"
                        [rounded]="true"
                        (onClick)="viewEvent(event)"
                        pTooltip="Voir l'événement"
                      />
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ParticipantDetailComponent implements OnInit {
  participant: any = null;
  events: any[] = [];
  loading = false;
  
  participationStats = {
    totalEvents: 0,
    upcomingEvents: 0,
    pastEvents: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private participantService: ParticipantService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadParticipant(id);
    }
  }

  loadParticipant(id: string): void {
    this.loading = true;
    
    this.participantService.getParticipantById(id).subscribe({
      next: (data) => {
        this.participant = data;
        this.loadParticipantEvents(id);
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les informations du participant'
        });
        this.loading = false;
        this.router.navigate(['/participants']);
      }
    });
  }

  loadParticipantEvents(participantId: string): void {
    
    this.events = [];
    
    const today = new Date();
    this.participationStats = {
      totalEvents: this.events.length,
      upcomingEvents: this.events.filter(e => new Date(e.startDate) > today).length,
      pastEvents: this.events.filter(e => new Date(e.endDate) < today).length
    };
  }

  getInitials(): string {
    if (!this.participant) return '';
    const first = this.participant.firstName?.charAt(0) || '';
    const last = this.participant.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  switch (status) {
    case 'PLANIFIE':
      return 'info';
    case 'EN_COURS':
      return 'warn';
    case 'TERMINE':       
      return 'success';
    case 'ANNULE':
      return 'danger';
    case 'REPORTER':
      return 'secondary';
    default:
      return 'info';
  }
}

  editParticipant(): void {
    this.router.navigate(['/participants', this.participant.id, 'edit']);
  }

  viewEvent(event: any): void {
    this.router.navigate(['/events', event.id]);
  }

  goBack(): void {
    this.router.navigate(['/participants']);
  }
}