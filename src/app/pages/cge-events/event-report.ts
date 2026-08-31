import { Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../service/event.service';
import { AgendaYearService } from '../../service/agenda-year.service';
import { environments } from '../../../environments/environments';
import { Event, EventTypeLabels, EventStatusLabels, EVENT_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from '../../models';

@Component({
    selector:     'app-event-report',
    standalone:   true,
    imports:      [CommonModule, FormsModule, DatePipe],
    templateUrl:  './event-report.html',
    styleUrls:    ['./event-report.css'],
    providers:    [DatePipe]
})
export class EventReportComponent implements OnInit, AfterViewInit {

    gridVisible = false;
    isProd = environments.production;

    @HostListener('document:keydown', ['$event'])
    onKeydown(e: KeyboardEvent): void {
        if (!this.isProd && e.altKey && (e.key === 'g' || e.key === 'G')) {
            e.preventDefault();
            this.toggleGrid();
        }
    }

    toggleGrid(): void {
        if (this.isProd) return;
        this.gridVisible = !this.gridVisible;
        document.body.classList.toggle('mb-grid-on', this.gridVisible);
    }

    ngAfterViewInit(): void {
        const cols = document.getElementById('mb-cols-rp');
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

    loading        = false;
    allEvents:      Event[] = [];
    filteredEvents: Event[] = [];
    today          = new Date();

    filterYear:   number | null = null;
    filterStatus  = '';
    filterType    = '';

    availableYears: number[] = [];

    statusOptions = EVENT_STATUS_OPTIONS;

    typeOptions = EVENT_TYPE_OPTIONS;

    constructor(
        private eventService:       EventService,
        private agendaYearService:  AgendaYearService,
        private router:             Router
    ) {}

    ngOnInit(): void {
        this.filterYear = this.agendaYearService.year();
        this.loading = true;
        this.eventService.getAllEvents().subscribe({
            next: (events) => {
                this.allEvents = events.sort((a, b) =>
                    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                );
                this.extractYears();
                this.applyFilters();
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    private extractYears(): void {
        const years = new Set(
            this.allEvents.map(e => new Date(e.startDate).getFullYear())
        );
        this.availableYears = Array.from(years).sort((a, b) => b - a);
    }

    applyFilters(): void {
        this.filteredEvents = this.allEvents.filter(ev => {
            const year = new Date(ev.startDate).getFullYear();
            if (this.filterYear   && year        !== this.filterYear)   return false;
            if (this.filterStatus && ev.status   !== this.filterStatus) return false;
            if (this.filterType   && ev.type     !== this.filterType)   return false;
            return true;
        });
    }

    get totalEvents(): number { return this.filteredEvents.length; }

    countByStatus(status: string): number {
        return this.filteredEvents.filter(e => e.status === status).length;
    }

    getTypeLabel(type: string):    string { return EventTypeLabels[type]    || type    || '—'; }
    getStatusLabel(status: string): string { return EventStatusLabels[status] || status || '—'; }

    getLieu(ev: Event): string {
        if ((ev as any).lieuType === 'INTERNE' && (ev as any).salle) return (ev as any).salle;
        if ((ev as any).lieuType === 'VIRTUEL')                       return 'Virtuel';
        if (ev.ville && ev.pays)   return `${ev.ville}, ${ev.pays}`;
        if (ev.ville)              return ev.ville;
        if ((ev as any).nomLieu)   return (ev as any).nomLieu;
        return '—';
    }

    print(): void { window.print(); }

    back(): void { this.router.navigate(['/events']); }
}
