import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Table, TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ParticipantService } from '../../service/participant.service';
import { EventService } from '../../service/event.service';
import { getEventStatusSeverity } from '../../models';

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
  styleUrls: ['./participant-detail.css'],
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
                  <a [href]="'mailto:' + participant.email" style="color: var(--cge-vert-moyen); text-decoration: none;">
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
                <span class="info-label">Structure</span>
                <div class="info-value">
                  <i class="pi pi-building"></i>
                  {{ participant.structure || 'Non renseignée' }}
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
    private eventService: EventService,
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
    this.eventService.getEventsByParticipant(participantId).subscribe({
      next: (events) => {
        this.events = events;
        const today = new Date();
        this.participationStats = {
          totalEvents: this.events.length,
          upcomingEvents: this.events.filter(e => new Date(e.startDate) > today).length,
          pastEvents: this.events.filter(e => new Date(e.endDate) < today).length
        };
      },
      error: () => {
        this.events = [];
        this.participationStats = { totalEvents: 0, upcomingEvents: 0, pastEvents: 0 };
      }
    });
  }

  getInitials(): string {
    if (!this.participant) return '';
    const first = this.participant.firstName?.charAt(0) || '';
    const last = this.participant.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return getEventStatusSeverity(status);
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