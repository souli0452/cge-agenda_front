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
        this.initCalendar();
    }

    initCalendar(): void {
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
            }
        });

        this.calendar.render();
    }

    loadEvents(): void {
        this.loading = true;
        this.eventService.getAllEvents().subscribe({
            next: (events: Event[]) => {
                this.events = events;
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

        // Filtre par mot-clé
        if (this.searchKeyword) {
            filteredEvents = filteredEvents.filter(event =>
                event.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
                event.description?.toLowerCase().includes(this.searchKeyword.toLowerCase())
            );
        }

        // Filtre par type
        if (this.selectedType) {
            filteredEvents = filteredEvents.filter(event => event.type === this.selectedType);
        }

        // Filtre par statut
        if (this.selectedStatus) {
            filteredEvents = filteredEvents.filter(event => event.status === this.selectedStatus);
        }

        // Convertir en events FullCalendar
        const calendarEvents = filteredEvents.map(event => this.convertToCalendarEvent(event));
        
        // Mettre à jour le calendrier
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

    exportToPDF(): void {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4
    
    // En-tête
    doc.setFillColor(34, 139, 34);
    doc.rect(0, 0, 297, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Calendrier des Événements', 148.5, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total: ${this.events.length} événement(s)`, 148.5, 22, { align: 'center' });
    
    // Tableau des événements
    const tableData = this.events.map(event => [
        event.title,
        this.getTypeLabel(event.type),
        new Date(event.startDate).toLocaleDateString('fr-FR'),
        new Date(event.endDate).toLocaleDateString('fr-FR'),
        this.getStatusLabel(event.status),
        `${event.ville || '-'}, ${event.pays || '-'}`,
        (event.participants?.length || 0).toString()
    ]);
    
    autoTable(doc, {
        head: [['Titre', 'Type', 'Date début', 'Date fin', 'Statut', 'Lieu', 'Participants']],
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
            0: { cellWidth: 50 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 30 },
            5: { cellWidth: 40 },
            6: { cellWidth: 20, halign: 'center' }
        }
    });
    
    // Pied de page
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
    
    // Téléchargement
    const filename = `calendrier_evenements_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    this.messageService.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Calendrier exporté en PDF'
    });
}
}