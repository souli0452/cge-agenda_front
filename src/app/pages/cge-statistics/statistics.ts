import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { StatsService } from '../../service/stats.service';
import { DashboardStats } from '../../models';
import { EventService } from '../../service/event.service';
import { ParticipantService } from '../../service/participant.service';
import { Event, Participant, EventTypeLabels, EventStatusLabels } from '../../models';

// PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-cge-statistics',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        Card,
        Button,
        ChartModule,
        Select,
        Toast
    ],
    providers: [MessageService],
    templateUrl: './cge-statistics.html',
    styleUrls: ['./cge-statistics.css']
})
export class CgeStatisticsComponent implements OnInit {
    loading = false;
    
    // Stats globales
    stats: DashboardStats | null = null;
    
    // Données locales
    events: Event[] = [];
    participants: Participant[] = [];
    
    // Charts
    typeChartData: any;
    statusChartData: any;
    monthlyChartData: any;
    chartOptions: any;

    // Filtres
    selectedYear: number = new Date().getFullYear();
    yearOptions: { label: string; value: number }[] = [];

    // Top participants calculés localement
    topParticipants: { name: string; count: number }[] = [];

    constructor(
        private statsService: StatsService,
        private eventService: EventService,
        private participantService: ParticipantService,
        private messageService: MessageService
    ) {
        this.initYearOptions();
        this.initChartOptions();
    }

    ngOnInit(): void {
        this.loadData();
    }

    initYearOptions(): void {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 2; i++) {
            this.yearOptions.push({ label: i.toString(), value: i });
        }
    }

    initChartOptions(): void {
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        padding: 15
                    }
                }
            }
        };
    }

    loadData(): void {
        this.loading = true;
        
        Promise.all([
            this.statsService.getDashboardStats().toPromise(),
            this.eventService.getAllEvents().toPromise(),
            this.participantService.getAllParticipants().toPromise()
        ]).then(([stats, events, participants]) => {
            this.stats = stats || null;
            this.events = events || [];
            this.participants = participants || [];
            
            this.calculateLocalStats();
            this.prepareCharts();
            this.loading = false;
        }).catch((error) => {
            console.error('Erreur chargement:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Impossible de charger les données'
            });
            this.loading = false;
        });
    }

    calculateLocalStats(): void {
        // Filtrer par année
        const filteredEvents = this.events.filter(e => 
            new Date(e.startDate).getFullYear() === this.selectedYear
        );

        // Calculer top participants
        const participantCount: { [key: string]: { name: string; count: number } } = {};
        
        filteredEvents.forEach(event => {
            event.participants?.forEach(p => {
                const key = p.id || '';
                if (!participantCount[key]) {
                    participantCount[key] = {
                        name: `${p.firstName} ${p.lastName}`,
                        count: 0
                    };
                }
                participantCount[key].count++;
            });
        });

        this.topParticipants = Object.values(participantCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    prepareCharts(): void {
        if (!this.stats) return;

        // Chart par type
        const typeLabels = Object.keys(this.stats.eventsByType).map(
            type => EventTypeLabels[type] || type
        );
        const typeData = Object.values(this.stats.eventsByType);
        const typeColors = [
            '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
            '#EF4444', '#EC4899', '#6B7280'
        ];

        this.typeChartData = {
            labels: typeLabels,
            datasets: [{
                data: typeData,
                backgroundColor: typeColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        // Chart par statut
        const statusLabels = Object.keys(this.stats.eventsByStatus).map(
            status => EventStatusLabels[status] || status
        );
        const statusData = Object.values(this.stats.eventsByStatus);
        const statusColors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#6B7280'];

        this.statusChartData = {
            labels: statusLabels,
            datasets: [{
                data: statusData,
                backgroundColor: statusColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        };

        // Chart mensuel
        const monthlyData = new Array(12).fill(0);
        this.events
            .filter(e => new Date(e.startDate).getFullYear() === this.selectedYear)
            .forEach(e => {
                const month = new Date(e.startDate).getMonth();
                monthlyData[month]++;
            });

        this.monthlyChartData = {
            labels: [
                'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
                'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
            ],
            datasets: [{
                label: 'Événements',
                data: monthlyData,
                backgroundColor: 'rgba(34, 139, 34, 0.2)',
                borderColor: '#228B22',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };
    }

    onYearChange(): void {
        this.calculateLocalStats();
        this.prepareCharts();
    }

    exportStatisticsToPDF(): void {
        if (!this.stats) return;

        const doc = new jsPDF();

        // Header
        doc.setFillColor(34, 139, 34);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('📊 Statistiques des Événements', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Année : ${this.selectedYear}`, 105, 30, { align: 'center' });

        // Stats générales
        let yPos = 50;
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Vue d\'ensemble', 20, yPos);

        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        const generalStats = [
            [`Total événements`, this.stats.totalEvents.toString()],
            [`Total participants`, this.stats.totalParticipants.toString()],
            [`Événements à venir`, this.stats.upcomingEventsCount.toString()]
        ];

        autoTable(doc, {
            body: generalStats,
            startY: yPos,
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 100 },
                1: { halign: 'right', cellWidth: 80 }
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Événements par type
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Répartition par type', 20, yPos);

        yPos += 10;
        const typeData = Object.entries(this.stats.eventsByType).map(([type, count]) => [
            EventTypeLabels[type] || type,
           String(count)
        ]);

        autoTable(doc, {
            body: typeData,
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [34, 139, 34] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Top participants
        if (this.topParticipants.length > 0) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Top 10 Participants', 20, yPos);

            yPos += 10;
            const participantData = this.topParticipants.map(p => [
                p.name,
                p.count.toString()
            ]);

            autoTable(doc, {
                head: [['Participant', 'Événements']],
                body: participantData,
                startY: yPos,
                theme: 'grid',
                headStyles: { fillColor: [34, 139, 34] }
            });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(150);
            doc.setFontSize(9);
            doc.text(
                `CGE Agenda - Page ${i}/${pageCount}`,
                105,
                290,
                { align: 'center' }
            );
        }

        doc.save(`statistiques_${this.selectedYear}.pdf`);

        this.messageService.add({
            severity: 'success',
            summary: 'Export réussi',
            detail: 'Statistiques exportées en PDF'
        });
    }
}