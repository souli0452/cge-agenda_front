import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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
} from '../../models'

@Component({
    selector: 'app-cge-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        ButtonModule,
        ChartModule,
        TableModule,
        TagModule
    ],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <!-- KPI Cards -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Total Événements</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ stats?.totalEvents || 0 }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-calendar text-blue-500 text-xl!"></i>
                        </div>
                    </div>
                    <span class="text-primary font-medium">{{ stats?.upcomingEventsCount || 0 }} </span>
                    <span class="text-muted-color">à venir</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Participants</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ stats?.totalParticipants || 0 }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-users text-orange-500 text-xl!"></i>
                        </div>
                    </div>
                    <span class="text-muted-color">participants uniques</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">En Cours</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ getStatusCount('EN_COURS') }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-clock text-cyan-500 text-xl!"></i>
                        </div>
                    </div>
                    <span class="text-muted-color">événements actifs</span>
                </div>
            </div>

            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <div class="card mb-0">
                    <div class="flex justify-between mb-4">
                        <div>
                            <span class="block text-muted-color font-medium mb-4">Terminés</span>
                            <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                                {{ getStatusCount('TERMINE') }}
                            </div>
                        </div>
                        <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" 
                             style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-check-circle text-purple-500 text-xl!"></i>
                        </div>
                    </div>
                    <span class="text-muted-color">événements complétés</span>
                </div>
            </div>

            <!-- Charts -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <h5 class="mb-0">Événements par Type</h5>
                    <p-chart type="doughnut" [data]="chartDataByType" [options]="chartOptions" height="300px"></p-chart>
                </div>
            </div>

            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <h5 class="mb-0">Événements par Statut</h5>
                    <p-chart type="bar" [data]="chartDataByStatus" [options]="chartOptions" height="300px"></p-chart>
                </div>
            </div>

            <!-- Recent Events Table -->
            <div class="col-span-12">
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <h5 class="m-0">Événements Récents</h5>
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
                        styleClass="p-datatable-sm">
                        
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Titre</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Statut</th>
                                <th style="width: 8rem">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-event>
                            <tr>
                                <td>
                                    <span class="font-medium">{{ event.title }}</span>
                                </td>
                                <td>
                                    <p-tag 
                                        [value]="getTypeLabel(event.type)" 
                                        [severity]="getTypeSeverity(event.type)">
                                    </p-tag>
                                </td>
                                <td>{{ event.startDate | date:'dd/MM/yyyy' }}</td>
                                <td>
                                    <p-tag 
                                        [value]="getStatusLabel(event.status)" 
                                        [severity]="getStatusSeverity(event.status)">
                                    </p-tag>
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <p-button 
                                            icon="pi pi-eye" 
                                            [rounded]="true" 
                                            [text]="true" 
                                            severity="secondary"
                                            (onClick)="viewEvent(event.id)">
                                        </p-button>
                                        <p-button 
                                            icon="pi pi-pencil" 
                                            [rounded]="true" 
                                            [text]="true" 
                                            severity="secondary"
                                            (onClick)="editEvent(event.id)">
                                        </p-button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="5" class="text-center py-8">
                                    <i class="pi pi-calendar-times text-6xl text-muted-color mb-4"></i>
                                    <p class="text-muted-color m-0">Aucun événement</p>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>
    `
})
export class CgeDashboardComponent implements OnInit {
    loading = false;
    stats?: DashboardStats;
    recentEvents: Event[] = [];
    chartDataByType: any;
    chartDataByStatus: any;
    chartOptions: any;

    constructor(
        private statsService: StatsService,
        private eventService: EventService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.initChartOptions();
        this.loadData();
    }

    loadData(): void {
        this.loading = true;

        this.statsService.getDashboardStats().subscribe({
            next: (data: DashboardStats) => {
                this.stats = data;
                this.prepareCharts();
            },
            error: (err: any) => console.error(err)
        });

        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                this.recentEvents = events
                    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                    .slice(0, 5);
                this.loading = false;
            },
            error: (err: any) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    prepareCharts(): void {
        if (!this.stats) return;

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
                ]
            }]
        };

        const statusLabels = Object.keys(this.stats.eventsByStatus);
        const statusData = Object.values(this.stats.eventsByStatus);

        this.chartDataByStatus = {
            labels: statusLabels.map((s: string) => this.getStatusLabel(s)),
            datasets: [{
                label: 'Nombre',
                data: statusData,
                backgroundColor: 'rgb(66, 165, 245)'
            }]
        };
    }

    initChartOptions(): void {
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        color: 'rgb(107, 114, 128)'
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
        if (id) this.router.navigate(['/events', id]);
    }

    editEvent(id: string | undefined): void {
        if (id) this.router.navigate(['/events', id, 'edit']);
    }

    viewAllEvents(): void {
        this.router.navigate(['/events']);
    }
}