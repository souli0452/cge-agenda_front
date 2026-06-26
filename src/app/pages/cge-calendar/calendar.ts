import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { EventService } from '../../service/event.service';
import { AgendaYearService } from '../../service/agenda-year.service';
import {
    Event,
    EventType,
    EventStatus,
    EVENT_TYPE_OPTIONS,
    EVENT_STATUS_OPTIONS,
    EventTypeLabels,
    EventStatusLabels
} from '../../models';

const STATUTS_EXCLUS_CALENDRIER = ['EN_ATTENTE_VALIDATION', 'REJETE'];

@Component({
    selector: 'app-cge-calendar',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        Select, Button, InputText,
        IconField, InputIcon,
        Dialog, Toast
    ],
    providers: [MessageService],
    templateUrl: './calendar.html',
    styleUrls: ['./calendar.css']
})
export class CgeCalendarComponent implements OnInit, AfterViewInit {
    @ViewChild('calendarEl', { static: false }) calendarEl!: ElementRef;

    private calendar!: Calendar;

    events: Event[] = [];
    loading = false;

    searchKeyword  = '';
    selectedType:   EventType   | null = null;
    selectedStatus: EventStatus | null = null;

    typeOptions   = EVENT_TYPE_OPTIONS;
    statusOptions = EVENT_STATUS_OPTIONS.filter(
        (o: any) => !STATUTS_EXCLUS_CALENDRIER.includes(o.value)
    );

    eventDetailDialogVisible = false;
    selectedEvent: Event | null = null;

    currentView: 'day' | 'week' | 'month' | 'list' = 'month';
    currentDate: Date = new Date();

    legendItems = [
        { type: 'REUNION',    label: 'Réunion',     color: '#3B82F6' },
        { type: 'CONFERENCE', label: 'Conférence',  color: '#8B5CF6' },
        { type: 'ATELIER',    label: 'Atelier',     color: '#10B981' },
        { type: 'SEMINAIRE',  label: 'Séminaire',   color: '#F59E0B' },
        { type: 'FORMATION',  label: 'Formation',   color: '#EF4444' },
        { type: 'MISSION',    label: 'Mission',     color: '#EC4899' },
        { type: 'AUTRE',      label: 'Autre',       color: '#6B7280' }
    ];

    constructor(
        private eventService:       EventService,
        private messageService:     MessageService,
        private router:             Router,
        private agendaYearService:  AgendaYearService
    ) {
        effect(() => {
            const year = this.agendaYearService.year();
            if (this.calendarReady) {
                this.loadEvents();
                this.calendar.gotoDate(new Date(year, 0, 1));
            }
        });
    }

    private calendarReady = false;

    ngOnInit(): void {
        this.loadEvents();
    }

    ngAfterViewInit(): void {
        if (this.calendarEl?.nativeElement) {
            this.initCalendar();
        } else {
            setTimeout(() => {
                if (this.calendarEl?.nativeElement) this.initCalendar();
            }, 0);
        }
    }

    initCalendar(): void {
        if (!this.calendarEl?.nativeElement) return;

        this.calendar = new Calendar(this.calendarEl.nativeElement, {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
            initialView: 'dayGridMonth',
            locale: frLocale,
            headerToolbar: {
                left:   'prev,next today',
                center: 'title',
                right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            buttonText: {
                today: "Aujourd'hui",
                month: 'Mois',
                week:  'Semaine',
                day:   'Jour',
                list:  'Liste'
            },
            height:       'auto',
            editable:     false,
            selectable:   true,
            selectMirror: true,
            dayMaxEvents: 3,
            weekends:     true,
            eventClick: (info) => this.handleEventClick(info),
            events: [],
            eventTimeFormat: {
                hour: '2-digit', minute: '2-digit', hour12: false
            },
            slotLabelFormat: {
                hour: '2-digit', minute: '2-digit', hour12: false
            },
            datesSet: (dateInfo) => this.updateCurrentViewInfo(dateInfo)
        });

        this.calendar.render();
        this.calendarReady = true;
    }

    updateCurrentViewInfo(dateInfo: any): void {
        const viewType = dateInfo.view.type;

        if      (viewType === 'dayGridMonth')                              this.currentView = 'month';
        else if (viewType === 'timeGridWeek' || viewType === 'dayGridWeek') this.currentView = 'week';
        else if (viewType === 'timeGridDay'  || viewType === 'dayGridDay')  this.currentView = 'day';
        else if (viewType === 'listWeek')                                   this.currentView = 'list';

        if (this.currentView === 'month') {
            const start = new Date(dateInfo.start);
            const end   = new Date(dateInfo.end);
            this.currentDate = new Date((start.getTime() + end.getTime()) / 2);
        } else {
            this.currentDate = new Date(dateInfo.start);
        }
    }

    loadEvents(): void {
        this.loading = true;
        const year = this.agendaYearService.year();
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                this.events = events.filter(e =>
                    !STATUTS_EXCLUS_CALENDRIER.includes(e.status as string) &&
                    new Date(e.startDate).getFullYear() === year
                );
                this.applyFilters();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error', summary: 'Erreur',
                    detail: 'Impossible de charger les événements'
                });
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        let filtered = this.events;

        filtered = filtered.filter(
            e => !STATUTS_EXCLUS_CALENDRIER.includes(e.status as string)
        );

        if (this.searchKeyword) {
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                e.description?.toLowerCase().includes(this.searchKeyword.toLowerCase())
            );
        }

        if (this.selectedType) {
            filtered = filtered.filter(e => e.type === this.selectedType);
        }

        if (this.selectedStatus) {
            filtered = filtered.filter(e => e.status === this.selectedStatus);
        }

        const calendarEvents = filtered.map(e => this.convertToCalendarEvent(e));

        if (this.calendar) {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(calendarEvents);
        }
    }

    convertToCalendarEvent(event: Event): any {
        return {
            id:              event.id,
            title:           event.title,
            start:           event.startDate,
            end:             event.endDate,
            backgroundColor: this.getEventColor(event.type),
            borderColor:     this.getStatusColor(event.status),
            textColor:       '#ffffff',
            extendedProps: {
                eventData: event,
                type:      event.type,
                status:    event.status
            }
        };
    }

    getEventColor(type: string): string {
        const colorMap: Record<string, string> = {
            'REUNION':    '#3B82F6',
            'CONFERENCE': '#8B5CF6',
            'ATELIER':    '#10B981',
            'SEMINAIRE':  '#F59E0B',
            'FORMATION':  '#EF4444',
            'MISSION':    '#EC4899',
            'AUTRE':      '#6B7280'
        };
        return colorMap[type] || '#6B7280';
    }

    getStatusColor(status: string): string {
        const colorMap: Record<string, string> = {
            'PLANIFIE':  '#3B82F6',
            'EN_COURS':  '#F59E0B',
            'TERMINE':   '#10B981',
            'ANNULER':   '#EF4444',
            'REPORTER':  '#6B7280'
        };
        return colorMap[status] || '#6B7280';
    }

    handleEventClick(info: any): void {
        this.selectedEvent           = info.event.extendedProps.eventData as Event;
        this.eventDetailDialogVisible = true;
    }

    resetFilters(): void {
        this.searchKeyword  = '';
        this.selectedType   = null;
        this.selectedStatus = null;
        this.applyFilters();
    }

    getTypeLabel(type: string):     string { return EventTypeLabels[type]    || type; }
    getStatusLabel(status: string): string { return EventStatusLabels[status] || status; }

    get eventsToday(): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return this.events.filter(e => {
            const start = new Date(e.startDate); start.setHours(0,0,0,0);
            const end   = new Date(e.endDate);   end.setHours(23,59,59,999);
            return start <= today && end >= today;
        }).length;
    }

    get eventsThisMonth(): number {
        const now   = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return this.events.filter(e =>
            new Date(e.startDate) <= end && new Date(e.endDate) >= start
        ).length;
    }

    darkenColor(hex: string): string {
        if (!hex || hex.length < 7) return hex;
        try {
            const r = Math.max(0, parseInt(hex.slice(1,3), 16) - 45);
            const g = Math.max(0, parseInt(hex.slice(3,5), 16) - 45);
            const b = Math.max(0, parseInt(hex.slice(5,7), 16) - 45);
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        } catch { return hex; }
    }

    viewEventDetails(): void {
        if (this.selectedEvent?.id)
            this.router.navigate(['/events', this.selectedEvent.id]);
    }

    editEvent(): void {
        if (this.selectedEvent?.id)
            this.router.navigate(['/events', this.selectedEvent.id, 'edit']);
    }

    createEvent():   void { this.router.navigate(['/events/create']); }
    goToListView():  void { this.router.navigate(['/events']); }
    exportToPDF(): void {
        const exportDate = this.calendar ? this.calendar.getDate() : this.currentDate;

        let filteredEvents = this.events.filter(event => {
            const matchesKeyword = !this.searchKeyword ||
                event.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                event.description?.toLowerCase().includes(this.searchKeyword.toLowerCase());
            const matchesType   = !this.selectedType   || event.type   === this.selectedType;
            const matchesStatus = !this.selectedStatus || event.status === this.selectedStatus;
            return matchesKeyword && matchesType && matchesStatus;
        });

        const eventsToExport = this.filterEventsByCurrentView(filteredEvents, exportDate);
        const title          = this.getExportTitle(exportDate);
        this.generatePDF(eventsToExport, title);
    }

    filterEventsByCurrentView(events: Event[], exportDate: Date): Event[] {
        switch (this.currentView) {
            case 'day':   return this.filterEventsByDay(events, exportDate);
            case 'week':  return this.filterEventsByWeek(events, exportDate);
            case 'month': return this.filterEventsByMonth(events, exportDate);
            case 'list':  return this.filterEventsByWeek(events, exportDate);
            default:      return events;
        }
    }

    filterEventsByDay(events: Event[], date: Date): Event[] {
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return events.filter(event => {
            const startDay = new Date(new Date(event.startDate).setHours(0,0,0,0));
            const endDay   = new Date(new Date(event.endDate).setHours(0,0,0,0));
            return startDay <= targetDate && endDay >= targetDate;
        });
    }

    filterEventsByWeek(events: Event[], date: Date): Event[] {
        const d       = new Date(date);
        const dow     = d.getDay();
        const monday  = new Date(d);
        monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
        monday.setHours(0,0,0,0);
        const sunday  = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);

        return events.filter(e =>
            new Date(e.startDate) <= sunday &&
            new Date(e.endDate)   >= monday
        );
    }

    filterEventsByMonth(events: Event[], date: Date): Event[] {
        const year       = date.getFullYear();
        const month      = date.getMonth();
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59, 999);

        return events.filter(e => {
            const start = new Date(e.startDate);
            const end   = new Date(e.endDate);
            return (start >= monthStart && start <= monthEnd) ||
                   (end   >= monthStart && end   <= monthEnd) ||
                   (start < monthStart  && end   > monthEnd);
        });
    }

    getExportTitle(exportDate: Date): string {
        switch (this.currentView) {
            case 'day':
                return `Événements du ${exportDate.toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' })}`;
            case 'week': {
                const monday = this.getMonday(exportDate);
                const sunday = this.getSunday(exportDate);
                return `Événements du ${monday.toLocaleDateString('fr-FR')} au ${sunday.toLocaleDateString('fr-FR')}`;
            }
            case 'month':
                return `Événements de ${exportDate.toLocaleDateString('fr-FR', { year:'numeric', month:'long' })}`;
            case 'list': {
                const monday = this.getMonday(exportDate);
                const sunday = this.getSunday(exportDate);
                return `Liste des événements (${monday.toLocaleDateString('fr-FR')} - ${sunday.toLocaleDateString('fr-FR')})`;
            }
            default:
                return 'Calendrier des Événements';
        }
    }

    getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
        return d;
    }

    getSunday(date: Date): Date {
        const monday = this.getMonday(date);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return sunday;
    }

    generatePDF(events: Event[], title: string): void {
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFillColor(34, 139, 34);
        doc.rect(0, 0, 297, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 148.5, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total: ${events.length} événement(s)`, 148.5, 22, { align: 'center' });

        const formatDate = (dateString: string, schedules: any[] = []): string => {
            const date = new Date(dateString);
            if (!schedules || schedules.length === 0) return date.toLocaleDateString('fr-FR');
            const s = schedules.find(s => new Date(s.dateJour).toDateString() === date.toDateString());
            if (s) return `${date.toLocaleDateString('fr-FR')} ${s.startTime} - ${s.endTime}`;
            return date.toLocaleDateString('fr-FR');
        };

        const tableData = events.map(event => [
            event.title,
            this.getTypeLabel(event.type),
            formatDate(event.startDate, event.schedules),
            formatDate(event.endDate,   event.schedules),
            this.getStatusLabel(event.status),
            `${event.ville || '-'}, ${event.pays || '-'}`,
            (event.participants?.length || 0).toString(),
            (event as any).structures?.join(', ') || 'Aucune'
        ]);

        autoTable(doc, {
            head: [['Titre', 'Type', 'Date début', 'Date fin', 'Statut', 'Lieu', 'Part.', 'Structures']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                0: { cellWidth: 45 }, 1: { cellWidth: 25 },
                2: { cellWidth: 30 }, 3: { cellWidth: 30 },
                4: { cellWidth: 25 }, 5: { cellWidth: 35 },
                6: { cellWidth: 15, halign: 'center' }, 7: { cellWidth: 35 }
            }
        });

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(150);
            doc.setFontSize(8);
            doc.text(
                `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
                148.5, 205, { align: 'center' }
            );
        }

        const viewLabel  = { day:'jour', week:'semaine', month:'mois', list:'liste' }[this.currentView] || 'calendrier';
        doc.save(`calendrier_${viewLabel}_${new Date().toISOString().split('T')[0]}.pdf`);

        this.messageService.add({
            severity: 'success', summary: 'Succès',
            detail: `Export PDF ${viewLabel} réussi (${events.length} événement(s))`
        });
    }
    exportToExcel(): void {
        const exportDate     = this.calendar ? this.calendar.getDate() : this.currentDate;
        const filteredEvents = this.events.filter(e => {
            const kw = this.searchKeyword?.toLowerCase();
            return (!kw || e.title.toLowerCase().includes(kw) || e.description?.toLowerCase().includes(kw))
                && (!this.selectedType   || e.type   === this.selectedType)
                && (!this.selectedStatus || e.status === this.selectedStatus);
        });
        const eventsToExport = this.filterEventsByCurrentView(filteredEvents, exportDate);

        const data = eventsToExport.map(e => ({
            'Titre':        e.title,
            'Type':         this.getTypeLabel(e.type),
            'Statut':       this.getStatusLabel(e.status),
            'Date début':   new Date(e.startDate).toLocaleDateString('fr-FR'),
            'Date fin':     new Date(e.endDate).toLocaleDateString('fr-FR'),
            'Lieu':         [e.ville, e.pays].filter(Boolean).join(', ') || '—',
            'Participants': e.participants?.length ?? 0,
            'Description':  e.description || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data.length ? data : [{}]);
        if (data.length) {
            const keys = Object.keys(data[0]);
            ws['!cols'] = keys.map(k => ({
                wch: Math.max(k.length, ...data.map(r => String((r as any)[k] ?? '').length))
            }));
        }
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Calendrier');

        const viewLabel = { day:'jour', week:'semaine', month:'mois', list:'liste' }[this.currentView] || 'calendrier';
        XLSX.writeFile(wb, `calendrier_${viewLabel}_${new Date().toISOString().split('T')[0]}.xlsx`);

        this.messageService.add({
            severity: 'success', summary: 'Succès',
            detail: `Export Excel ${viewLabel} réussi (${eventsToExport.length} événement(s))`
        });
    }
}