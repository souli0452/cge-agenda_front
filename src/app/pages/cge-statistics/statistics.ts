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


import 'jspdf-autotable';

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
    
    
    stats: DashboardStats | null = null;
    
   
    yearStats = {
        totalEvents: 0,
        totalParticipants: 0,
        upcomingEvents: 0,
        totalGlobal: 0
    };
    
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
            
            console.log(`📊 Chargé: ${this.events.length} événements totaux`);
            
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
        console.log(`🔍 Calcul stats pour l'année ${this.selectedYear}`);
        
        
        const filteredEvents = this.events.filter(e => {
            const eventYear = new Date(e.startDate).getFullYear();
            return eventYear === this.selectedYear;
        });

        console.log(`📋 ${filteredEvents.length} événements trouvés pour ${this.selectedYear}`);

        this.yearStats.totalEvents = filteredEvents.length;
        
       
        const uniqueParticipants = new Set(
            filteredEvents.flatMap(e => e.participants?.map(p => p.id) || [])
        );
        this.yearStats.totalParticipants = uniqueParticipants.size;
      
        const now = new Date();
        this.yearStats.upcomingEvents = filteredEvents.filter(e => 
            new Date(e.startDate) > now
        ).length;
        
        
        this.yearStats.totalGlobal = this.events.length;

        
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
        
        console.log(`📊 Stats ${this.selectedYear}:`, {
            événements: this.yearStats.totalEvents,
            participants: this.yearStats.totalParticipants,
            àVenir: this.yearStats.upcomingEvents,
            topParticipants: this.topParticipants.length
        });
    }

    prepareCharts(): void {
      
        const yearEvents = this.events.filter(e => 
            new Date(e.startDate).getFullYear() === this.selectedYear
        );

        const typeCount: { [key: string]: number } = {};
        yearEvents.forEach(e => {
            typeCount[e.type] = (typeCount[e.type] || 0) + 1;
        });

        const typeLabels = Object.keys(typeCount).map(
            type => EventTypeLabels[type] || type
        );
        const typeData = Object.values(typeCount);
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

      
        const statusCount: { [key: string]: number } = {};
        yearEvents.forEach(e => {
            statusCount[e.status] = (statusCount[e.status] || 0) + 1;
        });

        const statusLabels = Object.keys(statusCount).map(
            status => EventStatusLabels[status] || status
        );
        const statusData = Object.values(statusCount);
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

      
        const monthlyData = new Array(12).fill(0);
        yearEvents.forEach(e => {
            const month = new Date(e.startDate).getMonth();
            monthlyData[month]++;
        });

        console.log(`📊 Données mensuelles ${this.selectedYear}:`, monthlyData);

        this.monthlyChartData = {
            labels: [
                'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
                'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
            ],
            datasets: [{
                label: `Événements ${this.selectedYear}`,
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
        console.log(`🔄 Changement d'année vers: ${this.selectedYear}`);
        this.calculateLocalStats();
        this.prepareCharts();
    }

   
    exportStatisticsToPDF(): void {
        const doc = new jsPDF();

        doc.setFont('helvetica');

        // Header
        doc.setFillColor(34, 139, 34);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistiques des Evenements', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Annee : ${this.selectedYear}`, 105, 30, { align: 'center' });

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
            [`Total evenements ${this.selectedYear}`, this.yearStats.totalEvents.toString()],
            [`Total participants actifs`, this.yearStats.totalParticipants.toString()],
            [`Evenements a venir`, this.yearStats.upcomingEvents.toString()],
            [`Total global (toutes annees)`, this.yearStats.totalGlobal.toString()]
        ];

        autoTable(doc, {
            body: generalStats,
            startY: yPos,
            theme: 'grid',
            styles: { 
                fontSize: 10,
                font: 'helvetica'
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 100 },
                1: { halign: 'right', cellWidth: 80 }
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Événements par type
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Repartition par type', 20, yPos);

        yPos += 10;
        
        const yearEvents = this.events.filter(e => 
            new Date(e.startDate).getFullYear() === this.selectedYear
        );
        
        const typeCount: { [key: string]: number } = {};
        yearEvents.forEach(e => {
            typeCount[e.type] = (typeCount[e.type] || 0) + 1;
        });

        const typeData = Object.entries(typeCount).map(([type, count]) => [
            EventTypeLabels[type] || type,
            String(count)
        ]);

        if (typeData.length > 0) {
            autoTable(doc, {
                head: [['Type', 'Nombre']],
                body: typeData,
                startY: yPos,
                theme: 'striped',
                styles: { font: 'helvetica' },
                headStyles: { 
                    fillColor: [34, 139, 34],
                    font: 'helvetica',
                    fontStyle: 'bold'
                }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

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
                head: [['Participant', 'Evenements']],
                body: participantData,
                startY: yPos,
                theme: 'grid',
                styles: { font: 'helvetica' },
                headStyles: { 
                    fillColor: [34, 139, 34],
                    font: 'helvetica',
                    fontStyle: 'bold'
                }
            });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(150);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
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
            summary: 'Export reussi',
            detail: `Statistiques ${this.selectedYear} exportees en PDF`
        });
    }
}