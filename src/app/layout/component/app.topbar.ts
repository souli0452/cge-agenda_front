import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from '../../service/auth.service';
import { EventService } from '../../service/event.service';
import { AgendaYearService } from '../../service/agenda-year.service';
import { EventStatus } from '../../models/enums';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, MenuModule, AvatarModule],
    styles: [`
        // Styles pour le logo dans la topbar
        .layout-topbar-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            padding: 0 1rem;
            transition: opacity 0.3s ease;
        }

        .layout-topbar-logo:hover {
            opacity: 0.9;
        }

        .layout-topbar-logo:focus {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
            border-radius: 4px;
        }

        .topbar-logo-img {
            height: 45px;
            width: auto;
            max-width: 180px;
            object-fit: contain;
            transition: transform 0.3s ease, opacity 0.3s ease;
            animation: fadeInLogo 0.5s ease-out;
        }

        .topbar-logo-img:hover {
            transform: scale(1.02);
        }

        @media (prefers-reduced-motion: reduce) {
            .topbar-logo-img {
                animation: none;
                transition: none;
            }
            .notification-badge {
                animation: none;
            }
        }

        // Ajustements pour le conteneur du logo
        .layout-topbar-logo-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        // Animation au chargement
        @keyframes fadeInLogo {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        // Responsive - tablettes
        @media (max-width: 991px) {
            .topbar-logo-img {
                height: 38px;
                max-width: 150px;
            }

            .layout-topbar-logo {
                padding: 0 0.5rem;
            }
        }

        // Responsive - mobiles
        @media (max-width: 576px) {
            .topbar-logo-img {
                height: 32px;
                max-width: 120px;
            }

            .layout-topbar-logo {
                padding: 0 0.25rem;
            }
        }

        // Support pour le mode sombre (optionnel)
        :host-context(.layout-dark) .topbar-logo-img {
            // Si vous avez besoin d'ajuster le logo en mode sombre
            // filter: brightness(1.1);
        }

        .notification-bell {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            text-decoration: none;
        }

        .notification-badge {
            position: absolute;
            top: 2px;
            right: 2px;
            background: #ef4444;
            color: #fff;
            border-radius: 9999px;
            font-size: 0.62rem;
            font-weight: 700;
            min-width: 17px;
            height: 17px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 3px;
            line-height: 1;
            pointer-events: none;
            border: 2px solid var(--surface-card, #fff);
            box-shadow: 0 1px 4px rgba(239,68,68,.4);
            animation: badgePop .2s ease-out;
        }

        @keyframes badgePop {
            from { transform: scale(0); }
            to   { transform: scale(1); }
        }

        /* ── Sélecteur d'année ───────────────────────────────── */
        .year-selector {
            display:       flex;
            align-items:   center;
            gap:           2px;
            background:    var(--surface-100, #f4f4f5);
            border:        1px solid var(--surface-200, #e4e4e7);
            border-radius: 6px;
            padding:       2px 4px;
            transition:    background 0.2s, border-color 0.2s;
        }
        .year-selector--past {
            background:   #FEF3C7;
            border-color: #FCD34D;
        }
        .year-btn {
            display:         flex;
            align-items:     center;
            justify-content: center;
            width:           24px;
            height:          24px;
            border:          none;
            background:      transparent;
            border-radius:   4px;
            cursor:          pointer;
            color:           var(--text-color-secondary);
            transition:      background 0.15s, color 0.15s;
            font-size:       0.75rem;
            padding:         0;
        }
        .year-btn:hover:not(:disabled) {
            background: var(--surface-200, #e4e4e7);
            color:      var(--text-color);
        }
        .year-btn:disabled {
            opacity: 0.35;
            cursor:  not-allowed;
        }
        .year-label {
            font-size:      0.875rem;
            font-weight:    700;
            font-variant-numeric: tabular-nums;
            min-width:      40px;
            text-align:     center;
            cursor:         pointer;
            color:          var(--text-color);
            letter-spacing: 0.02em;
            user-select:    none;
            padding:        0 4px;
        }
        .year-selector--past .year-label { color: #92400E; }
        .year-past-badge {
            font-size:      9px;
            font-weight:    700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color:          #92400E;
            background:     #FDE68A;
            border-radius:  3px;
            padding:        1px 4px;
            margin-left:    2px;
        }
    `],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action"
                        aria-label="Ouvrir le menu de navigation"
                        (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars" aria-hidden="true"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <img src="assets/images/logo-asce-lcnav.png" alt="ASCE-LC Logo" class="topbar-logo-img" />
                </a>
            </div>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button type="button" class="layout-topbar-action"
                            [attr.aria-label]="layoutService.isDarkTheme() ? 'Passer en mode clair' : 'Passer en mode sombre'"
                            (click)="toggleDarkMode()">
                        <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }" aria-hidden="true"></i>
                    </button>
                    <div class="relative">
                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            aria-label="Personnaliser le thème"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-palette" aria-hidden="true"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

        <!-- Sélecteur d'année -->
        <div class="year-selector" [class.year-selector--past]="!agendaYearService.isCurrentYear()"
             [title]="yearSelectorTitle">
            <button class="year-btn"
                    (click)="agendaYearService.prev()"
                    [disabled]="agendaYearService.year() <= 2020"
                    aria-label="Année précédente">
                <i class="pi pi-chevron-left" aria-hidden="true"></i>
            </button>
            <span class="year-label"
                  (click)="agendaYearService.resetToCurrentYear()"
                  [title]="yearLabelTitle">
                {{ agendaYearService.year() }}
            </span>
            <span *ngIf="!agendaYearService.isCurrentYear()" class="year-past-badge" aria-hidden="true">ARCHIVE</span>
            <button class="year-btn"
                    (click)="agendaYearService.next()"
                    [disabled]="agendaYearService.isCurrentYear()"
                    aria-label="Année suivante">
                <i class="pi pi-chevron-right" aria-hidden="true"></i>
            </button>
        </div>

        <!-- Badge notification événements en attente — visible CGE / ADMIN uniquement -->
        <a *ngIf="authService.canValidateEvent"
           routerLink="/validation"
           class="layout-topbar-action notification-bell"
           [attr.aria-label]="pendingCount > 0 ? pendingCount + ' événement(s) en attente de validation' : 'Validation CGE'">
            <i class="pi pi-bell" aria-hidden="true"></i>
            <span *ngIf="pendingCount > 0" class="notification-badge" aria-hidden="true">
                {{ pendingCount > 99 ? '99+' : pendingCount }}
            </span>
        </a>

<p-menu #menu [popup]="true" [model]="items" appendTo="body"></p-menu>

<button type="button" class="layout-topbar-action"
        [attr.aria-label]="'Menu utilisateur : ' + (user?.firstName || 'Compte')"
        (click)="menu.toggle($event)">
    <p-avatar
        *ngIf="user?.firstName"
        [label]="user.firstName.charAt(0).toUpperCase()"
        styleClass="mr-2"
        shape="circle">{{ user.firstName.charAt(0).toLocaleUpperCase() }}
    </p-avatar>
    <p-avatar
        *ngIf="!user?.firstName"
        icon="pi pi-user"
        styleClass="mr-2"
     shape="circle">
    </p-avatar>
</button>

            </div>
        </div>
    `
})
export class AppTopbar implements OnInit, OnDestroy {

    public user: any = { firstName: '', lastName: '' };
    items: MenuItem[] | undefined;
    pendingCount = 0;

    private pollSub?: Subscription;

    constructor(
        public layoutService:    LayoutService,
        private keycloakService: KeycloakService,
        public authService:      AuthService,
        private eventService:    EventService,
        public agendaYearService: AgendaYearService,
        private router:          Router
    ) {}

    async ngOnInit() {
        if (await this.keycloakService.isLoggedIn()) {
            const profile = await this.keycloakService.loadUserProfile();
            this.user = {
                firstName: profile.firstName || '',
                lastName:  profile.lastName  || '',
                username:  profile.username
            };
        }

        this.items = [
            { label: 'Profil',        icon: 'pi pi-user',     command: () => this.goToProfile() },
            { label: 'Déconnexion',   icon: 'pi pi-sign-out', command: () => this.keycloakService.logout() }
        ];

        if (this.authService.canValidateEvent) {
            this.pollSub = interval(60_000).pipe(
                startWith(0),
                switchMap(() => this.eventService.getAllEvents())
            ).subscribe({
                next:  events => {
                    this.pendingCount = events.filter(
                        e => e.status === EventStatus.EN_ATTENTE_VALIDATION
                    ).length;
                },
                error: () => { this.pendingCount = 0; }
            });
        }
    }

    ngOnDestroy(): void {
        this.pollSub?.unsubscribe();
    }

    get yearSelectorTitle(): string {
        return this.agendaYearService.isCurrentYear()
            ? 'Année en cours'
            : "Cliquez sur l'année pour revenir à aujourd'hui";
    }

    get yearLabelTitle(): string {
        return this.agendaYearService.isCurrentYear()
            ? ''
            : "Retour à l'année en cours";
    }

    goToProfile(): void {
        this.router.navigate(['/profile']);
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update(state => ({ ...state, darkTheme: !state.darkTheme }));
    }
}