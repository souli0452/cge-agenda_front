import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
                <div class="card mb-0 kpi-card kpi-card--blue">
                    <div class="kpi-value">{{ stats?.totalEvents || 0 }}</div>
                    <div class="kpi-label">Total Événements</div>
                    <div class="kpi-meta">
                        <i class="pi pi-calendar"></i>
                        <span>{{ stats?.upcomingEventsCount || 0 }} à venir</span>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 kpi-card kpi-card--amber">
                    <div class="kpi-value">{{ stats?.totalParticipants || 0 }}</div>
                    <div class="kpi-label">Participants</div>
                    <div class="kpi-meta">
                        <i class="pi pi-users"></i>
                        <span>participants uniques</span>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 kpi-card kpi-card--teal">
                    <div class="kpi-value">{{ getStatusCount('EN_COURS') }}</div>
                    <div class="kpi-label">En Cours</div>
                    <div class="kpi-meta">
                        <i class="pi pi-clock"></i>
                        <span>événements actifs</span>
                    </div>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0 kpi-card kpi-card--violet">
                    <div class="kpi-value">{{ getStatusCount('TERMINE') }}</div>
                    <div class="kpi-label">Terminés</div>
                    <div class="kpi-meta">
                        <i class="pi pi-check-circle"></i>
                        <span>événements complétés</span>
                    </div>
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
                            <tr class="cursor-pointer"
                                tabindex="0"
                                (click)="viewEvent(event.id)"
                                (keydown.enter)="viewEvent(event.id)"
                                (keydown.space)="viewEvent(event.id)">
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
                                            ariaLabel="Voir les détails"
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
                                            ariaLabel="Modifier l'événement"
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
                                            ariaLabel="Télécharger la liste d'émargement"
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
                <div class="card bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                    <div class="grid grid-cols-12 gap-6">
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-sky-600 dark:text-sky-400 mb-2" style="letter-spacing: -0.03em;">
                                {{ getStatusCount('PLANIFIE') }}
                            </div>
                            <div class="text-xs font-semibold text-muted-color uppercase" style="letter-spacing: 0.08em;">Planifiés</div>
                        </div>
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-2" style="letter-spacing: -0.03em;">
                                {{ getStatusCount('EN_COURS') }}
                            </div>
                            <div class="text-xs font-semibold text-muted-color uppercase" style="letter-spacing: 0.08em;">En Cours</div>
                        </div>
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2" style="letter-spacing: -0.03em;">
                                {{ getStatusCount('TERMINE') }}
                            </div>
                            <div class="text-xs font-semibold text-muted-color uppercase" style="letter-spacing: 0.08em;">Terminés</div>
                        </div>
                        <div class="col-span-12 md:col-span-3 text-center">
                            <div class="text-4xl font-bold text-rose-600 dark:text-rose-400 mb-2" style="letter-spacing: -0.03em;">
                                {{ getStatusCount('ANNULER') + getStatusCount('REPORTER') }}
                            </div>
                            <div class="text-xs font-semibold text-muted-color uppercase" style="letter-spacing: 0.08em;">Annulés / Reportés</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styleUrls: ['./dashboard.css']
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

        forkJoin({
            stats:  this.statsService.getDashboardStats().pipe(catchError(() => of(null))),
            events: this.eventService.getAllEvents()
        }).subscribe({
            next: ({ stats, events }) => {
                this.recentEvents = [...events]
                    .sort((a, b) =>
                        new Date(b.createdAt || b.startDate).getTime() -
                        new Date(a.createdAt || a.startDate).getTime()
                    )
                    .slice(0, 5);

                this.stats = stats ?? this.computeStatsFromEvents(events);
                this.prepareCharts();
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    private computeStatsFromEvents(events: Event[]): DashboardStats {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const eventsByStatus: { [key: string]: number } = {};
        const eventsByType:   { [key: string]: number } = {};
        let totalParticipants   = 0;
        let upcomingEventsCount = 0;

        for (const e of events) {
            eventsByStatus[e.status] = (eventsByStatus[e.status] || 0) + 1;
            eventsByType[e.type]     = (eventsByType[e.type]     || 0) + 1;
            totalParticipants       += e.participants?.length || 0;
            const start = new Date(e.startDate); start.setHours(0, 0, 0, 0);
            if (start >= now && !['ANNULER', 'REJETE'].includes(e.status as string)) {
                upcomingEventsCount++;
            }
        }

        return { totalEvents: events.length, upcomingEventsCount, totalParticipants, eventsByStatus, eventsByType };
    }

    loadEventsByStatusMonth(): void {
        this.statsService.getEventsByStatusAndMonth(this.currentYear).pipe(
            catchError(() => of(null))
        ).subscribe(data => {
            if (data) this.prepareStatusMonthChart(data);
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
            },
            error: () => {}
        });
    }

    viewAllEvents(): void {
        this.router.navigate(['/events']);
    }

    createEvent(): void {
        this.router.navigate(['/events/create']);
    }
}