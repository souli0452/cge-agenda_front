import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { EventService } from '../../service/event.service';
import { StatsService } from '../../service/stats.service';
import { 
    Event, 
    DashboardStats, 
    EventTypeLabels, 
    EventStatusLabels,
    getEventTypeSeverity,
    getEventStatusSeverity,
    TagSeverity
} from '../../models';

@Component({
    selector: 'app-cge-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        ChartModule,
        TableModule,
        TagModule,
        TooltipModule
    ],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <!-- Header Section -->
            <div class="col-span-12">
                <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                    <div>
                        <h3 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0 mb-2">
                            Tableau de bord CGE Agenda
                        </h3>
                        <p class="text-muted-color text-sm m-0">
                            Bienvenue sur votre tableau de bord de gestion des événements
                        </p>
                    </div>
                    <p-button 
                        label="Nouvel événement" 
                        icon="pi pi-plus" 
                        (onClick)="createEvent()"
                        [raised]="true"
                        size="large">
                    </p-button>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 hover:shadow-lg transition-shadow">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Total Événements</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ stats?.totalEvents || 0 }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-calendar text-blue-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-primary font-medium">{{ stats?.upcomingEventsCount || 0 }} </span>
                    <span class="text-muted-color">à venir</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 hover:shadow-lg transition-shadow">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Participants</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ stats?.totalParticipants || 0 }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-users text-orange-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-muted-color">participants uniques</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 hover:shadow-lg transition-shadow">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">En Cours</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ getStatusCount('EN_COURS') }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-clock text-cyan-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-muted-color">événements actifs</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 hover:shadow-lg transition-shadow">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Terminés</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ getStatusCount('TERMINE') }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-check-circle text-purple-500 text-xl"></i>
                        </div>
                    </div>
                    <span class="text-muted-color">événements complétés</span>
                </div>
            </div>

            <!-- Charts -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <h5 class="m-0">Événements par Type</h5>
                        <span class="text-sm text-muted-color">
                            Répartition des {{ stats?.totalEvents || 0 }} événements
                        </span>
                    </div>
                    <p-chart 
                        type="doughnut" 
                        [data]="chartDataByType" 
                        [options]="doughnutOptions" 
                        height="320px">
                    </p-chart>
                </div>
            </div>

            <!-- Histogramme par Statut et Mois -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <div class="flex justify-between items-center mb-4">
                        <h5 class="m-0">Événements par Statut et Mois</h5>
                        <span class="text-sm text-muted-color">Évolution mensuelle {{ currentYear }}</span>
                    </div>
                    <p-chart 
                        type="bar" 
                        [data]="chartDataByStatusMonth" 
                        [options]="barOptionsMonth" 
                        height="320px">
                    </p-chart>
                </div>
            </div>

            <!-- Recent Events Table -->
            <div class="col-span-12">
                <div class="card">
                    <div class="flex justify-between items-center mb-5">
                        <div>
                            <h5 class="m-0 mb-1">Événements Récents</h5>
                            <p class="text-muted-color text-sm m-0">
                                Les {{ recentEvents.length }} derniers événements créés
                            </p>
                        </div>
                        <p-button 
                            label="Voir tout" 
                            icon="pi pi-arrow-right" 
                            iconPos="right"
                            [text]="true" 
                            (onClick)="viewAllEvents()">
                        </p-button>
                    </div>

                    <p-table 
                        [value]="recentEvents" 
                        [loading]="loading"
                        responsiveLayout="scroll"
                        styleClass="p-datatable-sm p-datatable-striped"
                        [tableStyle]="{'min-width': '60rem'}">
                        
                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 30%">Événement</th>
                                <th style="width: 15%">Type</th>
                                <th style="width: 15%">Date</th>
                                <th style="width: 12%">Statut</th>
                                <th style="width: 10%" class="text-center">Participants</th>
                                <th style="width: 18%">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-event>
                            <tr class="cursor-pointer" (click)="viewEvent(event.id)">
                                <td>
                                    <div class="flex flex-col gap-1">
                                        <span class="font-semibold text-surface-900 dark:text-surface-0">
                                            {{ event.title }}
                                        </span>
                                        <span class="text-xs text-muted-color" *ngIf="event.description">
                                            {{ event.description | slice:0:60 }}{{ event.description.length > 60 ? '...' : '' }}
                                        </span>
                                        <div class="flex items-center gap-1 mt-1" *ngIf="event.ville || event.pays">
                                            <i class="pi pi-map-marker text-xs text-muted-color"></i>
                                            <span class="text-xs text-muted-color">
                                                {{ event.ville }}{{ event.ville && event.pays ? ', ' : '' }}{{ event.pays }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p-tag 
                                        [value]="getTypeLabel(event.type)" 
                                        [severity]="getTypeSeverity(event.type)"
                                        [rounded]="true">
                                    </p-tag>
                                </td>
                                <td>
                                    <div class="flex flex-col gap-1">
                                        <div class="flex items-center gap-2">
                                            <i class="pi pi-calendar text-sm text-muted-color"></i>
                                            <span class="font-medium">{{ event.startDate | date:'dd/MM/yyyy' }}</span>
                                        </div>
                                        <span class="text-xs text-muted-color" *ngIf="event.endDate !== event.startDate">
                                            → {{ event.endDate | date:'dd/MM/yyyy' }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <p-tag 
                                        [value]="getStatusLabel(event.status)" 
                                        [severity]="getStatusSeverity(event.status)"
                                        [rounded]="true">
                                    </p-tag>
                                </td>
                                <td class="text-center">
                                    <div class="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-border px-3 py-1">
                                        <i class="pi pi-users text-sm"></i>
                                        <span class="font-semibold">{{ event.participants?.length || 0 }}</span>
                                    </div>
                                </td>
                                <td (click)="$event.stopPropagation()">
                                    <div class="flex gap-1">
                                        <p-button 
                                            icon="pi pi-eye" 
                                            [rounded]="true" 
                                            [text]="true" 
                                            severity="secondary"
                                            size="small"
                                            pTooltip="Voir détails"
                                            tooltipPosition="top"
                                            (onClick)="viewEvent(event.id)">
                                        </p-button>
                                        <p-button 
                                            icon="pi pi-pencil" 
                                            [rounded]="true" 
                                            [text]="true" 
                                            severity="secondary"
                                            size="small"
                                            pTooltip="Modifier"
                                            tooltipPosition="top"
                                            (onClick)="editEvent(event.id)">
                                        </p-button>
                                        <p-button 
                                            icon="pi pi-download" 
                                            [rounded]="true" 
                                            [text]="true" 
                                            severity="help"
                                            size="small"
                                            pTooltip="Liste émargement"
                                            tooltipPosition="top"
                                            (onClick)="downloadAttendance(event.id)">
                                        </p-button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center py-12">
                                    <div class="flex flex-col items-center gap-3">
                                        <i class="pi pi-calendar-times text-6xl text-muted-color"></i>
                                        <div>
                                            <p class="text-surface-900 dark:text-surface-0 font-semibold text-lg m-0 mb-2">
                                                Aucun événement
                                            </p>
                                            <p class="text-muted-color m-0 mb-4">
                                                Commencez par créer votre premier événement
                                            </p>
                                            <p-button 
                                                label="Créer un événement" 
                                                icon="pi pi-plus" 
                                                (onClick)="createEvent()">
                                            </p-button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="loadingbody">
                            <tr>
                                <td colspan="6">
                                    <div class="flex items-center justify-center py-8">
                                        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <!-- Quick Stats Footer -->
            <div class="col-span-12">
                <div class="card bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                                {{ getStatusCount('PLANIFIE') }}
                            </div>
                            <div class="text-sm text-muted-color font-medium">Événements Planifiés</div>
                        </div>
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                                {{ getStatusCount('EN_COURS') }}
                            </div>
                            <div class="text-sm text-muted-color font-medium">En Cours</div>
                        </div>
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                                {{ getStatusCount('TERMINE') }}
                            </div>
                            <div class="text-sm text-muted-color font-medium">Terminés</div>
                        </div>
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                                {{ getStatusCount('ANNULER') + getStatusCount('REPORTER') }}
                            </div>
                            <div class="text-sm text-muted-color font-medium">Annulés / Reportés</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep {
            .p-chart canvas {
                max-height: 320px;
            }
            
            .p-datatable .p-datatable-tbody > tr {
                transition: all 0.2s ease;
            }
            
            .p-datatable .p-datatable-tbody > tr:hover {
                background: var(--surface-hover) !important;
                transform: scale(1.01);
            }
            
            .p-tag {
                font-size: 0.7rem;
                padding: 0.25rem 0.5rem;
                font-weight: 600;
            }
            
            .p-button.p-button-sm {
                padding: 0.375rem;
            }
            
            .card {
                transition: all 0.3s ease;
            }
            
            .card.hover\\:shadow-lg:hover {
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            .cursor-pointer {
                cursor: pointer;
            }
        }
    `]
})
export class CgeDashboardComponent implements OnInit {
    loading = false;
    stats?: DashboardStats;
    recentEvents: Event[] = [];
    chartDataByType: any;
    chartDataByStatusMonth: any; 
    doughnutOptions: any;
    barOptionsMonth: any;
    
    // Année courante dynamique
    currentYear: number = new Date().getFullYear();

    constructor(
        private statsService: StatsService,
        private eventService: EventService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initChartOptions();
        this.loadData();
        this.loadEventsByStatusMonth(); 
    }

    loadData(): void {
        this.loading = true;

        // Charger les statistiques
        this.statsService.getDashboardStats().subscribe({
            next: (data: DashboardStats) => {
                this.stats = data;
                this.prepareCharts();
                console.log(' Stats chargées:', this.stats);
            },
            error: (err: any) => {
                console.error('Erreur stats:', err);
            }
        });

        // Charger les événements récents
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                this.recentEvents = events
                    .sort((a, b) => {
                        const dateA = new Date(a.createdAt || a.startDate).getTime();
                        const dateB = new Date(b.createdAt || b.startDate).getTime();
                        return dateB - dateA;
                    })
                    .slice(0, 5);
                
                this.loading = false;
                console.log(' Événements récents:', this.recentEvents.length);
            },
            error: (err: any) => {
                console.error(' Erreur événements:', err);
                this.loading = false;
            }
        });
    }

    loadEventsByStatusMonth(): void {
        // Utilise l'année courante dynamiquement
        this.statsService.getEventsByStatusAndMonth(this.currentYear).subscribe({
            next: (data: any) => {
                console.log(' Données par statut/mois:', data);
                this.prepareStatusMonthChart(data);
            },
            error: (err: any) => {
                console.error(' Erreur stats par mois:', err);
            }
        });
    }

    prepareCharts(): void {
        if (!this.stats) return;

        // Chart par type (Doughnut)
        const typeLabels = Object.keys(this.stats.eventsByType);
        const typeData = Object.values(this.stats.eventsByType);

        this.chartDataByType = {
            labels: typeLabels.map((t: string) => this.getTypeLabel(t)),
            datasets: [{
                data: typeData,
                backgroundColor: [
                    'rgb(66, 165, 245)',
                    'rgb(102, 187, 106)',
                    'rgb(255, 167, 38)',
                    'rgb(171, 71, 188)',
                    'rgb(38, 198, 218)',
                    'rgb(120, 144, 156)',
                    'rgb(141, 110, 99)'
                ],
                hoverBackgroundColor: [
                    'rgba(66, 165, 245, 0.8)',
                    'rgba(102, 187, 106, 0.8)',
                    'rgba(255, 167, 38, 0.8)',
                    'rgba(171, 71, 188, 0.8)',
                    'rgba(38, 198, 218, 0.8)',
                    'rgba(120, 144, 156, 0.8)',
                    'rgba(141, 110, 99, 0.8)'
                ]
            }]
        };
    }

    prepareStatusMonthChart(data: any): void {
        const months = Object.keys(data[Object.keys(data)[0]]);
        
        const datasets = Object.keys(data).map(status => ({
            label: this.getStatusLabel(status),
            data: Object.values(data[status]),
            backgroundColor: this.getStatusChartColor(status),
            borderColor: this.getStatusChartBorderColor(status),
            borderWidth: 2,
            borderRadius: 6
        }));

        this.chartDataByStatusMonth = {
            labels: months,
            datasets: datasets
        };

        console.log(' Chart par statut/mois préparé');
    }

    getStatusChartColor(status: string): string {
        const colors: any = {
            'PLANIFIE': 'rgba(66, 165, 245, 0.8)',
            'EN_COURS': 'rgba(255, 167, 38, 0.8)',
            'TERMINE': 'rgba(102, 187, 106, 0.8)',
            'ANNULER': 'rgba(239, 83, 80, 0.8)',
            'REPORTER': 'rgba(171, 71, 188, 0.8)'
        };
        return colors[status] || 'rgba(120, 144, 156, 0.8)';
    }

    getStatusChartBorderColor(status: string): string {
        const colors: any = {
            'PLANIFIE': 'rgb(66, 165, 245)',
            'EN_COURS': 'rgb(255, 167, 38)',
            'TERMINE': 'rgb(102, 187, 106)',
            'ANNULER': 'rgb(239, 83, 80)',
            'REPORTER': 'rgb(171, 71, 188)'
        };
        return colors[status] || 'rgb(120, 144, 156)';
    }

    initChartOptions(): void {
        const textColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-color') || 'rgb(107, 114, 128)';
        const gridColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--surface-border') || 'rgba(160, 167, 181, 0.3)';

        // Doughnut Chart
        this.doughnutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        color: textColor,
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        };

        // HISTOGRAMME
        this.barOptionsMonth = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        color: textColor,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const value = context.parsed.y;
                            return `${context.dataset.label}: ${value} événement${value > 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        };
    }

    getStatusCount(status: string): number {
        return this.stats?.eventsByStatus?.[status] || 0;
    }

    getTypeLabel(type: string): string {
        return EventTypeLabels[type] || type;
    }

    getStatusLabel(status: string): string {
        return EventStatusLabels[status] || status;
    }

    getTypeSeverity(type: string): TagSeverity {
        return getEventTypeSeverity(type);
    }

    getStatusSeverity(status: string): TagSeverity {
        return getEventStatusSeverity(status);
    }

    viewEvent(id: string | undefined): void {
        if (id) {
            this.router.navigate(['/events', id]);
        }
    }

    editEvent(id: string | undefined): void {
        if (id) {
            this.router.navigate(['/events', id, 'edit']);
        }
    }

    downloadAttendance(id: string | undefined): void {
        if (!id) return;

        this.eventService.generateAttendanceSheet(id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `liste_emargement_${id}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                console.log(' Liste d\'émargement téléchargée');
            },
            error: (err: any) => {
                console.error(' Erreur téléchargement:', err);
            }
        });
    }

    viewAllEvents(): void {
        this.router.navigate(['/events']);
    }

    createEvent(): void {
        this.router.navigate(['/events/create']);
    }
}