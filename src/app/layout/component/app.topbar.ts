import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    styles: [`
        // Styles pour le logo dans la topbar
        .layout-topbar-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            padding: 0 1rem;
            transition: all 0.3s ease;
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
    `],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <img src="assets/images/logo-asce-lcnav.png" alt="ASCE-LC Logo" class="topbar-logo-img" />
                </a>
            </div>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                        <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                    </button>
                    <div class="relative">
                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

                <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                    <i class="pi pi-ellipsis-v"></i>
                </button>

                <div class="layout-topbar-menu hidden lg:block">
                    <div class="layout-topbar-menu-content">
                        <button type="button" class="layout-topbar-action" [routerLink]="['/auth/login']">
                            <i class="pi pi-user"></i>
                            <span>Profile</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class AppTopbar {
    items!: MenuItem[];

    constructor(public layoutService: LayoutService) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }
}