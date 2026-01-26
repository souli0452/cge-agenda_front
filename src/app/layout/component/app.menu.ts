import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
    {
        label: 'Navigation',
        items: [
            { 
                label: 'Tableau de bord', 
                icon: 'pi pi-fw pi-th-large', 
                routerLink: ['/dashboard'] 
            },
            { 
                label: 'Événements', 
                icon: 'pi pi-fw pi-calendar-plus', 
                routerLink: ['/events'],
                badge: '4',
                badgeClass: 'p-badge-danger'
            },
            { 
                label: 'Calendrier', 
                icon: 'pi pi-fw pi-calendar', 
                routerLink: ['/calendar'] 
            },
            { 
                label: 'Participants', 
                icon: 'pi pi-fw pi-users', 
                routerLink: ['/participants'] 
            },
        
            { 
                label: 'Statistiques', 
                icon: 'pi pi-fw pi-chart-line', 
                routerLink: ['/statistics'] 
            }
        ]
    }
    
];
    }
}
