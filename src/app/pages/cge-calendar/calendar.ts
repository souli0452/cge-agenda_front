import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { Divider } from 'primeng/divider';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// FullCalendar
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Services & Models
import { EventService } from '../../service/event.service';
import { 
    Event, 
    EventType, 
    EventStatus,
    EVENT_TYPE_OPTIONS,
    EVENT_STATUS_OPTIONS,
    EventTypeLabels,
    EventStatusLabels
} from '../../models';

@Component({
    selector: 'app-cge-calendar',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        Select,
        Button,
        InputText,
        IconField,
        InputIcon,
        Tag,
        Dialog,
        Divider,
        Toast
    ],
    providers: [MessageService],
    templateUrl: './calendar.html',
    styleUrls: ['./calendar.css']
})
export class CgeCalendarComponent implements OnInit, AfterViewInit {
    @ViewChild('calendarEl', { static: false }) calendarEl!: ElementRef;
    
    private calendar!: Calendar;

    // Data
    events: Event[] = [];
    loading = false;

    // Filters
    searchKeyword = '';
    selectedType: EventType | null = null;
    selectedStatus: EventStatus | null = null;
    typeOptions = EVENT_TYPE_OPTIONS;
    statusOptions = EVENT_STATUS_OPTIONS;

    // Event Detail Dialog
    eventDetailDialogVisible = false;
    selectedEvent: Event | null = null;

    // Tracking de la vue actuelle
    currentView: 'day' | 'week' | 'month' | 'list' = 'month';
    currentDate: Date = new Date();

    // Legend
    legendItems = [
        { type: 'REUNION', label: 'Réunion', color: '#3B82F6' },
        { type: 'CONFERENCE', label: 'Conférence', color: '#8B5CF6' },
        { type: 'ATELIER', label: 'Atelier', color: '#10B981' },
        { type: 'SEMINAIRE', label: 'Séminaire', color: '#F59E0B' },
        { type: 'FORMATION', label: 'Formation', color: '#EF4444' },
        { type: 'MISSION', label: 'Mission', color: '#EC4899' },
        { type: 'AUTRE', label: 'Autre', color: '#6B7280' }
    ];

    constructor(
        private eventService: EventService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadEvents();
    }

    ngAfterViewInit(): void {
        if (this.calendarEl && this.calendarEl.nativeElement) {
            this.initCalendar();
        } else {
            setTimeout(() => {
                if (this.calendarEl && this.calendarEl.nativeElement) {
                    this.initCalendar();
                }
            }, 0);
        }
    }

    initCalendar(): void {
        if (!this.calendarEl?.nativeElement) {
            console.error('❌ Calendar element not found');
            return;
        }

        this.calendar = new Calendar(this.calendarEl.nativeElement, {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
            initialView: 'dayGridMonth',
            locale: frLocale,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            buttonText: {
                today: "Aujourd'hui",
                month: 'Mois',
                week: 'Semaine',
                day: 'Jour',
                list: 'Liste'
            },
            height: 'auto',
            editable: false,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: 3,
            weekends: true,
            eventClick: (info) => this.handleEventClick(info),
            events: [],
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            datesSet: (dateInfo) => {
                this.updateCurrentViewInfo(dateInfo);
            }
        });

        this.calendar.render();
    }

    
    updateCurrentViewInfo(dateInfo: any): void {
        const viewType = dateInfo.view.type;
        
        if (viewType === 'dayGridMonth') {
            this.currentView = 'month';
        } else if (viewType === 'timeGridWeek' || viewType === 'dayGridWeek') {
            this.currentView = 'week';
        } else if (viewType === 'timeGridDay' || viewType === 'dayGridDay') {
            this.currentView = 'day';
        } else if (viewType === 'listWeek') {
            this.currentView = 'list';
        }

    
        if (this.currentView === 'month') {
            const start = new Date(dateInfo.start);
            const end = new Date(dateInfo.end);
            
            const middle = new Date((start.getTime() + end.getTime()) / 2);
            this.currentDate = middle;
        } else {
            this.currentDate = new Date(dateInfo.start);
        }
        
        console.log(`📅 Vue: ${this.currentView}, Date capturée: ${this.currentDate.toLocaleDateString('fr-FR')}, Mois: ${this.currentDate.getMonth() + 1}, Année: ${this.currentDate.getFullYear()}`);
    }

    loadEvents(): void {
        this.loading = true;
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                this.events = events;
                console.log(`📊 ${events.length} événements chargés`);
                this.applyFilters();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Impossible de charger les événements'
                });
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        let filteredEvents = this.events;

        if (this.searchKeyword) {
            filteredEvents = filteredEvents.filter(event =>
                event.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                event.description?.toLowerCase().includes(this.searchKeyword.toLowerCase())
            );
        }

        if (this.selectedType) {
            filteredEvents = filteredEvents.filter(event => event.type === this.selectedType);
        }

        if (this.selectedStatus) {
            filteredEvents = filteredEvents.filter(event => event.status === this.selectedStatus);
        }

        const calendarEvents = filteredEvents.map(event => this.convertToCalendarEvent(event));
        
        if (this.calendar) {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(calendarEvents);
        }
    }

    convertToCalendarEvent(event: Event): any {
        const color = this.getEventColor(event.type);
        const statusColor = this.getStatusColor(event.status);

        return {
            id: event.id,
            title: event.title,
            start: event.startDate,
            end: event.endDate,
            backgroundColor: color,
            borderColor: statusColor,
            textColor: '#ffffff',
            extendedProps: {
                eventData: event,
                type: event.type,
                status: event.status
            }
        };
    }

    getEventColor(type: string): string {
        const colorMap: Record<string, string> = {
            'REUNION': '#3B82F6',
            'CONFERENCE': '#8B5CF6',
            'ATELIER': '#10B981',
            'SEMINAIRE': '#F59E0B',
            'FORMATION': '#EF4444',
            'MISSION': '#EC4899',
            'AUTRE': '#6B7280'
        };
        return colorMap[type] || '#6B7280';
    }

    getStatusColor(status: string): string {
        const colorMap: Record<string, string> = {
            'PLANIFIE': '#3B82F6',
            'EN_COURS': '#F59E0B',
            'TERMINE': '#10B981',
            'ANNULE': '#EF4444',
            'REPORTER': '#6B7280'
        };
        return colorMap[status] || '#6B7280';
    }

    handleEventClick(info: any): void {
        const eventData = info.event.extendedProps.eventData as Event;
        this.selectedEvent = eventData;
        this.eventDetailDialogVisible = true;
    }

    resetFilters(): void {
        this.searchKeyword = '';
        this.selectedType = null;
        this.selectedStatus = null;
        this.applyFilters();
    }

    getTypeLabel(type: string): string {
        return EventTypeLabels[type] || type;
    }

    getStatusLabel(status: string): string {
        return EventStatusLabels[status] || status;
    }

    viewEventDetails(): void {
        if (this.selectedEvent?.id) {
            this.router.navigate(['/events', this.selectedEvent.id]);
        }
    }

    editEvent(): void {
        if (this.selectedEvent?.id) {
            this.router.navigate(['/events', this.selectedEvent.id, 'edit']);
        }
    }

    createEvent(): void {
        this.router.navigate(['/events/create']);
    }

    goToListView(): void {
        this.router.navigate(['/events']);
    }

    // ==========================================
    // EXPORT PDF INTELLIGENT
    // ==========================================
    exportToPDF(): void {
        
        const exportDate = this.calendar ? this.calendar.getDate() : this.currentDate;
        
        console.log(`🎯 Export PDF - Vue: ${this.currentView}`);
        console.log(`📅 Date d'export: ${exportDate.toLocaleDateString('fr-FR')}, Mois: ${exportDate.getMonth() + 1}, Année: ${exportDate.getFullYear()}`);
        
        let filteredEvents = this.events.filter(event => {
            const matchesKeyword = !this.searchKeyword ||
                event.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                event.description?.toLowerCase().includes(this.searchKeyword.toLowerCase());
            const matchesType = !this.selectedType || event.type === this.selectedType;
            const matchesStatus = !this.selectedStatus || event.status === this.selectedStatus;
            return matchesKeyword && matchesType && matchesStatus;
        });

        console.log(`📋 Après filtres: ${filteredEvents.length} événements`);

        const eventsToExport = this.filterEventsByCurrentView(filteredEvents, exportDate);
        
        console.log(`✅ À exporter: ${eventsToExport.length} événements`);

        const title = this.getExportTitle(exportDate);
        this.generatePDF(eventsToExport, title);
    }

    filterEventsByCurrentView(events: Event[], exportDate: Date): Event[] {
        console.log(`🔍 Filtrage par ${this.currentView}, Date: ${exportDate.toLocaleDateString('fr-FR')}`);

        switch (this.currentView) {
            case 'day':
                return this.filterEventsByDay(events, exportDate);
            
            case 'week':
                return this.filterEventsByWeek(events, exportDate);
            
            case 'month':
                return this.filterEventsByMonth(events, exportDate);
            
            case 'list':
                return this.filterEventsByWeek(events, exportDate);
            
            default:
                return events;
        }
    }

    filterEventsByDay(events: Event[], date: Date): Event[] {
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        console.log(`📅 Filtrage JOUR: ${targetDate.toLocaleDateString('fr-FR')}`);
        
        return events.filter(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            
            const startDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
            const endDay = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
            
            return startDay <= targetDate && endDay >= targetDate;
        });
    }

    filterEventsByWeek(events: Event[], date: Date): Event[] {
        const targetDate = new Date(date);
        
        const dayOfWeek = targetDate.getDay();
        const monday = new Date(targetDate);
        monday.setDate(targetDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        console.log(`📅 Filtrage SEMAINE: ${monday.toLocaleDateString('fr-FR')} - ${sunday.toLocaleDateString('fr-FR')}`);
        
        return events.filter(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            
            return eventStart <= sunday && eventEnd >= monday;
        });
    }

    filterEventsByMonth(events: Event[], date: Date): Event[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
        
        console.log(`📅 Filtrage MOIS: ${year}/${month + 1} → ${monthStart.toLocaleDateString('fr-FR')} - ${monthEnd.toLocaleDateString('fr-FR')}`);
        
        const filtered = events.filter(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            
            const isInMonth = 
                (eventStart >= monthStart && eventStart <= monthEnd) ||
                (eventEnd >= monthStart && eventEnd <= monthEnd) ||
                (eventStart < monthStart && eventEnd > monthEnd);
            
            if (isInMonth) {
                console.log(`  ✅ ${event.title}: ${eventStart.toLocaleDateString('fr-FR')} - ${eventEnd.toLocaleDateString('fr-FR')}`);
            }
            
            return isInMonth;
        });

        console.log(`✅ ${filtered.length} événements trouvés`);
        
        return filtered;
    }

    getExportTitle(exportDate: Date): string {
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };

        console.log(`📝 Titre pour: ${exportDate.toLocaleDateString('fr-FR')}, Mois: ${exportDate.getMonth() + 1}, Année: ${exportDate.getFullYear()}`);

        switch (this.currentView) {
            case 'day':
                return `Événements du ${exportDate.toLocaleDateString('fr-FR', options)}`;
            
            case 'week':
                const monday = this.getMonday(exportDate);
                const sunday = this.getSunday(exportDate);
                return `Événements de la semaine du ${monday.toLocaleDateString('fr-FR')} au ${sunday.toLocaleDateString('fr-FR')}`;
            
            case 'month':
                const monthOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
                const title = `Événements de ${exportDate.toLocaleDateString('fr-FR', monthOptions)}`;
                console.log(`📝 Titre généré: ${title}`);
                return title;
            
            case 'list':
                const mondayList = this.getMonday(exportDate);
                const sundayList = this.getSunday(exportDate);
                return `Liste des événements (${mondayList.toLocaleDateString('fr-FR')} - ${sundayList.toLocaleDateString('fr-FR')})`;
            
            default:
                return 'Calendrier des Événements';
        }
    }

    getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
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
    
    
    const formatDateWithTime = (dateString: string, schedules: any[] = []): string => {
        const date = new Date(dateString);
        
        
        if (!schedules || schedules.length === 0) {
            return date.toLocaleDateString('fr-FR');
        }
        
        
        const scheduleForDate = schedules.find(s => 
            new Date(s.dateJour).toDateString() === date.toDateString()
        );
        
        
        if (scheduleForDate) {
            const startTime = scheduleForDate.startTime;
            const endTime = scheduleForDate.endTime;
            
            return `${date.toLocaleDateString('fr-FR')} ${startTime} - ${endTime}`;
        }
        
        return date.toLocaleDateString('fr-FR');
    };

    const tableData = events.map(event => [
        event.title,
        this.getTypeLabel(event.type),
        formatDateWithTime(event.startDate, event.schedules), 
        formatDateWithTime(event.endDate, event.schedules),   
        this.getStatusLabel(event.status),
        `${event.ville || '-'}, ${event.pays || '-'}`,
        (event.participants?.length || 0).toString(),
        event.structures?.join(', ') || 'Aucune'
    ]);
    
    autoTable(doc, {
        head: [['Titre', 'Type', 'Date début', 'Date fin', 'Statut', 'Lieu', 'Part.', 'Structures']],
        body: tableData,
        startY: 35,
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [34, 139, 34],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 45 },
            1: { cellWidth: 25 },
            2: { cellWidth: 30 }, 
            3: { cellWidth: 30 }, 
            4: { cellWidth: 25 },
            5: { cellWidth: 35 },
            6: { cellWidth: 15, halign: 'center' },
            7: { cellWidth: 35 }
        }
    });
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(150);
        doc.setFontSize(8);
        doc.text(
            `Page ${i} sur ${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')}`,
            148.5,
            205,
            { align: 'center' }
        );
    }
    
    const viewLabel = this.currentView === 'day' ? 'jour' : 
                      this.currentView === 'week' ? 'semaine' : 
                      this.currentView === 'month' ? 'mois' : 'liste';
    const filename = `calendrier_${viewLabel}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: `Export ${viewLabel} réussi (${events.length} événement(s))`
    });
}
    
}