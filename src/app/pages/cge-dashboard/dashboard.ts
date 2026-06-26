import { Component, OnInit, AfterViewInit, OnDestroy, HostListener, effect } from '@angular/core';
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
import { AgendaYearService } from '../../service/agenda-year.service';
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
    templateUrl: './dashboard.html',
    styleUrls:   ['./dashboard.css']
})
export class CgeDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

    gridVisible = false;

    @HostListener('document:keydown', ['$event'])
    onKeydown(e: KeyboardEvent): void {
        if (e.altKey && (e.key === 'g' || e.key === 'G')) {
            e.preventDefault();
            this.toggleGrid();
        }
    }

    toggleGrid(): void {
        this.gridVisible = !this.gridVisible;
        document.body.classList.toggle('mb-grid-on', this.gridVisible);
    }

    ngAfterViewInit(): void {
        const cols = document.getElementById('mb-cols-db');
        if (!cols) return;
        const n = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--cols').trim() || '12', 10
        );
        for (let i = 1; i <= n; i++) {
            const col = document.createElement('div');
            col.className = 'mb-col';
            const span = document.createElement('span');
            span.textContent = String(i);
            col.appendChild(span);
            cols.appendChild(col);
        }
    }

    loading = false;
    stats?: DashboardStats;
    recentEvents: Event[] = [];
    chartDataByType: any;
    chartDataByStatusMonth: any;
    doughnutOptions: any;
    barOptionsMonth: any;

    get currentYear(): number { return this.agendaYearService.year(); }

    constructor(
        private statsService:       StatsService,
        private eventService:       EventService,
        public  agendaYearService:  AgendaYearService,
        private router:             Router
    ) {
        effect(() => {
            const _year = this.agendaYearService.year();
            if (this.initialized) {
                this.loadData();
                this.loadEventsByStatusMonth();
            }
        });
    }

    private initialized = false;

    ngOnInit(): void {
        this.initChartOptions();
        this.loadData();
        this.loadEventsByStatusMonth();
        this.initialized = true;
    }

    ngOnDestroy(): void {}


    loadData(): void {
        this.loading = true;
        const year = this.agendaYearService.year();
        forkJoin({
            stats:  this.statsService.getDashboardStats().pipe(catchError(() => of(null))),
            events: this.eventService.getAllEvents()
        }).subscribe({
            next: ({ stats, events }) => {
                const eventsOfYear = events.filter(e =>
                    new Date(e.startDate).getFullYear() === year
                );
                this.recentEvents = [...eventsOfYear]
                    .sort((a, b) =>
                        new Date(b.createdAt || b.startDate).getTime() -
                        new Date(a.createdAt || a.startDate).getTime()
                    )
                    .slice(0, 5);
                this.stats = this.computeStatsFromEvents(eventsOfYear);
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
        const typeLabels = Object.keys(this.stats.eventsByType);
        const typeData   = Object.values(this.stats.eventsByType);
        this.chartDataByType = {
            labels: typeLabels.map((t: string) => this.getTypeLabel(t)),
            datasets: [{
                data: typeData,
                backgroundColor: [
                    'rgb(66,165,245)', 'rgb(102,187,106)', 'rgb(255,167,38)',
                    'rgb(171,71,188)', 'rgb(38,198,218)',  'rgb(120,144,156)', 'rgb(141,110,99)'
                ],
                hoverBackgroundColor: [
                    'rgba(66,165,245,.8)', 'rgba(102,187,106,.8)', 'rgba(255,167,38,.8)',
                    'rgba(171,71,188,.8)', 'rgba(38,198,218,.8)',  'rgba(120,144,156,.8)', 'rgba(141,110,99,.8)'
                ]
            }]
        };
    }

    prepareStatusMonthChart(data: any): void {
        const months   = Object.keys(data[Object.keys(data)[0]]);
        const datasets = Object.keys(data).map(status => ({
            label:           this.getStatusLabel(status),
            data:            Object.values(data[status]),
            backgroundColor: this.getStatusChartColor(status),
            borderColor:     this.getStatusChartBorderColor(status),
            borderWidth: 2, borderRadius: 6
        }));
        this.chartDataByStatusMonth = { labels: months, datasets };
    }

    getStatusChartColor(status: string): string {
        const c: any = {
            'PLANIFIE': 'rgba(66,165,245,.8)',  'EN_COURS': 'rgba(255,167,38,.8)',
            'TERMINE':  'rgba(102,187,106,.8)', 'ANNULER':  'rgba(239,83,80,.8)',
            'REPORTER': 'rgba(171,71,188,.8)'
        };
        return c[status] || 'rgba(120,144,156,.8)';
    }

    getStatusChartBorderColor(status: string): string {
        const c: any = {
            'PLANIFIE': 'rgb(66,165,245)',  'EN_COURS': 'rgb(255,167,38)',
            'TERMINE':  'rgb(102,187,106)', 'ANNULER':  'rgb(239,83,80)',
            'REPORTER': 'rgb(171,71,188)'
        };
        return c[status] || 'rgb(120,144,156)';
    }

    initChartOptions(): void {
        const textColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-color') || 'rgb(107,114,128)';
        const gridColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--surface-border') || 'rgba(160,167,181,.3)';

        this.doughnutOptions = {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, color: textColor, font: { size: 12, family: 'Inter,sans-serif' } } },
                tooltip: { callbacks: { label: (ctx: any) => {
                    const v = ctx.parsed || 0;
                    const t = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    return `${ctx.label}: ${v} (${t > 0 ? ((v / t) * 100).toFixed(1) : 0}%)`;
                }}}
            }
        };

        this.barOptionsMonth = {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, padding: 15, color: textColor, font: { size: 11 } } },
                tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} événement${ctx.parsed.y > 1 ? 's' : ''}` }}
            },
            scales: {
                x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1, font: { size: 11 } }, grid: { color: gridColor } }
            }
        };
    }

    getStatusCount(status: string): number { return this.stats?.eventsByStatus?.[status] || 0; }
    getTypeLabel(type: string):   string { return EventTypeLabels[type]   || type; }
    getStatusLabel(status: string): string { return EventStatusLabels[status] || status; }
    getTypeSeverity(type: string):   TagSeverity { return getEventTypeSeverity(type); }
    getStatusSeverity(status: string): TagSeverity { return getEventStatusSeverity(status); }

    viewEvent(id: string | undefined): void { if (id) this.router.navigate(['/events', id]); }
    editEvent(id: string | undefined): void { if (id) this.router.navigate(['/events', id, 'edit']); }
    viewAllEvents(): void { this.router.navigate(['/events']); }
    createEvent(): void  { this.router.navigate(['/events/create']); }

    downloadAttendance(id: string | undefined): void {
        if (!id) return;
        this.eventService.generateAttendanceSheet(id).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `liste_emargement_${id}.xlsx`;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a); window.URL.revokeObjectURL(url);
            },
            error: () => {}
        });
    }
}
