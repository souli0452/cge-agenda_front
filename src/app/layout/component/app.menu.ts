import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { MenuItem }          from 'primeng/api';
import { AppMenuitem }       from './app.menuitem';
import { AuthService }       from '../../service/auth.service';
import { EventService }      from '../../service/event.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
            <ng-container *ngFor="let item of model; let i = index">
                <li app-menuitem
                    *ngIf="!item.separator"
                    [item]="item"
                    [index]="i"
                    [root]="true">
                </li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    `
})
export class AppMenu implements OnInit {

    model: MenuItem[] = [];
    pendingCount = 0;

    constructor(
        private authService:  AuthService,
        private eventService: EventService
    ) {}

    ngOnInit(): void {
        this.buildMenu();
        this.loadPendingCount();
    }

    loadPendingCount(): void {
        if (!this.authService.canValidateEvent) return;

        this.eventService.getAllEvents().subscribe({
            next: (events) => {
                this.pendingCount = events.filter(
                    e => (e.status as string) === 'EN_ATTENTE_VALIDATION'
                ).length;
                this.buildMenu();
            },
            error: () => {}
        });
    }

    buildMenu(): void {
        const isAdmin     = this.authService.isAdmin;
        const canExport   = this.authService.canExportPdf;
        const canValidate = this.authService.canValidateEvent;

        this.model = [

            // ==========================================
            // TABLEAU DE BORD
            // ==========================================
            {
                label: 'Accueil',
                items: [
                    {
                        label:      'Tableau de bord',
                        icon:       'pi pi-fw pi-th-large',
                        routerLink: ['/dashboard']
                    },
                    ...(canValidate ? [{
                        label:      'Validation CGE',
                        icon:       'pi pi-fw pi-shield',
                        routerLink: ['/validation'],
                        badge:      this.pendingCount > 0 ? String(this.pendingCount) : undefined,
                        badgeClass: 'p-badge-warning'
                    }] : [])
                ]
            },

            // ==========================================
            // GESTION DES ÉVÉNEMENTS
            // ==========================================
            {
                label: 'Gestion',
                items: [
                    {
                        label:      'Événements',
                        icon:       'pi pi-fw pi-calendar-plus',
                        routerLink: ['/events']
                    },
                    {
                        label:      'Calendrier',
                        icon:       'pi pi-fw pi-calendar',
                        routerLink: ['/calendar']
                    },
                    {
                        label:      'Participants',
                        icon:       'pi pi-fw pi-users',
                        routerLink: ['/participants']
                    }
                ]
            },

            // ==========================================
            // RAPPORTS — CGE, ADMIN, DIRECTEUR_CABINET
            // ==========================================
            ...(canExport ? [{
                label: 'Rapports',
                items: [{
                    label:      'Statistiques',
                    icon:       'pi pi-fw pi-chart-line',
                    routerLink: ['/statistics']
                }]
            }] : []),

            // ==========================================
            // ADMINISTRATION — ADMIN seulement
            // ==========================================
            ...(isAdmin ? [{
                label: 'Administration',
                items: [
                    {
                        label:      'Utilisateurs',
                        icon:       'pi pi-fw pi-id-card',
                        routerLink: ['/admin/users']
                    },
                    {
                        label:      'Journal d\'audit',
                        icon:       'pi pi-fw pi-list-check',
                        routerLink: ['/admin/audit']
                    },
                    {
                        label:      'Configuration',
                        icon:       'pi pi-fw pi-building',
                        routerLink: ['/admin/config']
                    },
                    {
                        label:      'Sauvegardes BD',
                        icon:       'pi pi-fw pi-database',
                        routerLink: ['/admin/backup']
                    },
                    {
                        label:      'Paramètres',
                        icon:       'pi pi-fw pi-cog',
                        routerLink: ['/settings']
                    }
                ]
            }] : [{
                label: 'Paramètres',
                items: [{
                    label:      'Paramètres',
                    icon:       'pi pi-fw pi-cog',
                    routerLink: ['/settings']
                }]
            }]),

           
            { separator: true },
            {
                label: 'Corbeille',
                items: [{
                    label:      'Corbeille',
                    icon:       'pi pi-fw pi-trash',
                    routerLink: ['/corbeille']
                }]
            }
        ];
    }
}