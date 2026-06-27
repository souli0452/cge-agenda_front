import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule }      from 'primeng/button';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule }         from 'primeng/tag';
import { ToastModule }       from 'primeng/toast';
import { TooltipModule }     from 'primeng/tooltip';
import { SelectModule }      from 'primeng/select';
import { InputTextModule }   from 'primeng/inputtext';
import { DatePickerModule }  from 'primeng/datepicker';
import { CardModule }        from 'primeng/card';
import { SkeletonModule }    from 'primeng/skeleton';
import { IconFieldModule }   from 'primeng/iconfield';
import { InputIconModule }   from 'primeng/inputicon';
import { MessageService }    from 'primeng/api';

import { AuditService, AuditLog, ActiveUser } from '../../../service/audit.service';

const ACTION_LABELS: Record<string, string> = {
    CREATION_EVENEMENT:   'Création',
    MODIFICATION_EVENEMENT: 'Modification',
    SUPPRESSION_CORBEILLE: 'Mise en corbeille',
    RESTAURATION_EVENEMENT: 'Restauration',
    SUPPRESSION_DEFINITIVE: 'Suppression définitive',
    VALIDATION_EVENEMENT:  'Validation',
    REJET_EVENEMENT:       'Rejet',
    DEMANDE_CORRECTIONS:   'Demande corrections',
    SOUMISSION_BROUILLON:  'Soumission brouillon',
    ANNULATION_EVENEMENT:  'Annulation',
    REPORT_EVENEMENT:      'Report',
    DELEGATION_PARTICIPATION: 'Délégation',
    AJOUT_PARTICIPANT:     'Ajout participant',
    RETRAIT_PARTICIPANT:   'Retrait participant',
    CONNEXION:             'Connexion',
};

@Component({
    selector: 'app-audit-log',
    standalone: true,
    imports: [
        CommonModule, FormsModule, DatePipe,
        ButtonModule, TableModule, TagModule, ToastModule, TooltipModule,
        SelectModule, InputTextModule, DatePickerModule, CardModule,
        SkeletonModule, IconFieldModule, InputIconModule
    ],
    providers: [MessageService],
    styleUrls: ['./audit-log.css'],
    template: `
<p-toast />

<div class="audit-page">

    <!-- EN-TÊTE -->
    <div class="audit-header">
        <div>
            <h2><i class="pi pi-shield mr-2" aria-hidden="true"></i>Journal d'audit</h2>
            <p>Traçabilité complète — actions, utilisateurs, adresses IP</p>
        </div>
        <div class="audit-header-actions">
            <!-- Toggle vue liste / cartes -->
            <div class="view-toggle">
                <button class="vt-btn" [class.vt-active]="auditViewMode === 'list'" (click)="auditViewMode = 'list'" title="Vue liste">
                    <i class="pi pi-list"></i>
                </button>
                <button class="vt-btn" [class.vt-active]="auditViewMode === 'card'" (click)="auditViewMode = 'card'" title="Vue cartes">
                    <i class="pi pi-th-large"></i>
                </button>
            </div>
            <p-button label="Rafraîchir" icon="pi pi-refresh" severity="secondary"
                      [outlined]="true" (onClick)="loadAll()" [loading]="loading" />
        </div>
    </div>

    <!-- UTILISATEURS ACTIFS (24h) -->
    <div class="card mb-4" *ngIf="activeUsers.length > 0">
        <div class="section-title">
            <i class="pi pi-users" style="color:#4caf50" aria-hidden="true"></i>
            Utilisateurs actifs (24 dernières heures)
            <span style="background:#e8f5e9;color:#388e3c;border-radius:12px;padding:2px 10px;font-size:12px;">
                {{ activeUsers.length }}
            </span>
        </div>
        <div class="active-users-grid">
            <div class="user-card" *ngFor="let u of activeUsers">
                <div class="avatar">{{ getInitials(u.userFullName) }}</div>
                <div class="info">
                    <div class="name">{{ u.userFullName || u.userEmail }}</div>
                    <div class="email">{{ u.userEmail }}</div>
                    <div class="last">{{ u.lastActivity | date:'dd/MM HH:mm' }}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- FILTRES -->
    <div class="filters-bar">
        <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Action</label>
            <p-select [options]="actionOptions" [(ngModel)]="filterAction"
                      placeholder="Toutes" [showClear]="true" (onChange)="applyFilters()" styleClass="w-full" />
        </div>
        <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Email utilisateur</label>
            <p-iconfield iconPosition="left">
                <p-inputicon styleClass="pi pi-search" />
                <input pInputText type="text" [(ngModel)]="filterEmail"
                       placeholder="Filtrer par email..." (input)="onEmailInput()" class="w-full" />
            </p-iconfield>
        </div>
        <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Du</label>
            <p-datepicker [(ngModel)]="filterFrom" (onSelect)="applyFilters()"
                          dateFormat="dd/mm/yy" [showClear]="true" styleClass="w-full" />
        </div>
        <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Au</label>
            <p-datepicker [(ngModel)]="filterTo" (onSelect)="applyFilters()"
                          dateFormat="dd/mm/yy" [showClear]="true" styleClass="w-full" />
        </div>
        <div style="display:flex;align-items:flex-end;">
            <p-button icon="pi pi-filter-slash" label="Réinitialiser"
                      severity="secondary" [outlined]="true" (onClick)="resetFilters()" />
        </div>
    </div>

    <!-- ── Vue CARTE (mobile + desktop toggle) ── -->
    <div class="audit-mobile-cards" [class.audit-cards-desktop]="auditViewMode === 'card'">
        @for (log of logs; track log.id) {
            <div class="audit-card">
                <div class="auc-header">
                    <span class="action-tag" [ngStyle]="getActionStyle(log.action)">
                        <i [class]="getActionIcon(log.action)"></i>
                        {{ getActionLabel(log.action) }}
                    </span>
                    <div class="auc-date">
                        <div style="font-size:13px;font-weight:600;">{{ log.timestamp | date:'dd/MM/yyyy' }}</div>
                        <div style="font-size:11px;color:var(--text-color-secondary)">{{ log.timestamp | date:'HH:mm:ss' }}</div>
                    </div>
                </div>
                <div class="auc-body">
                    @if (log.entityTitle) {
                        <div class="auc-row">
                            <i class="pi pi-calendar auc-icon"></i>
                            <span style="font-weight:600;">{{ log.entityTitle }}</span>
                        </div>
                    }
                    <div class="auc-row">
                        <i class="pi pi-user auc-icon"></i>
                        <span>{{ log.userFullName || log.userId }}</span>
                        @if (log.userRole) {
                            <span class="auc-role">{{ formatRole(log.userRole) }}</span>
                        }
                    </div>
                    @if (log.ipAddress) {
                        <div class="auc-row">
                            <i class="pi pi-desktop auc-icon"></i>
                            <span class="ip-chip">{{ log.ipAddress }}</span>
                        </div>
                    }
                    @if (log.details) {
                        <div class="auc-row auc-details">
                            <i class="pi pi-info-circle auc-icon"></i>
                            <span>{{ log.details }}</span>
                        </div>
                    }
                </div>
            </div>
        }
        @if (logs.length === 0 && !loading) {
            <div style="text-align:center;padding:40px;color:var(--text-color-secondary)">
                <i class="pi pi-inbox" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
                Aucune entrée d'audit
            </div>
        }
        <!-- Pagination mobile audit -->
        @if (totalRecords > 0) {
            <div class="audit-mobile-pag">
                <button class="mob-pag-btn" [disabled]="currentPage === 0"
                        (click)="currentPage = currentPage - 1; loadLogs()">
                    <i class="pi pi-chevron-left"></i>
                </button>
                <span class="mob-pag-info">
                    Page {{ currentPage + 1 }} / {{ Math.ceil(totalRecords / pageSize) }}
                    &nbsp;·&nbsp; {{ totalRecords }} entrée(s)
                </span>
                <button class="mob-pag-btn"
                        [disabled]="(currentPage + 1) >= Math.ceil(totalRecords / pageSize)"
                        (click)="currentPage = currentPage + 1; loadLogs()">
                    <i class="pi pi-chevron-right"></i>
                </button>
            </div>
        }
    </div>

    <!-- ── TABLEAU desktop ── -->
    <div class="card audit-desktop-table" [class.audit-table-hidden]="auditViewMode === 'card'">
        <p-table
            [value]="logs"
            [lazy]="true"
            [totalRecords]="totalRecords"
            [loading]="loading"
            [paginator]="true"
            [rows]="pageSize"
            [rowsPerPageOptions]="[20, 50, 100]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="{first}–{last} sur {totalRecords} entrées"
            (onLazyLoad)="onLazyLoad($event)"
            responsiveLayout="scroll"
            styleClass="p-datatable-sm p-datatable-hoverable-rows"
        >
            <ng-template pTemplate="header">
                <tr>
                    <th style="width:150px">Date / Heure</th>
                    <th style="width:160px">Action</th>
                    <th style="width:180px">Événement / Entité</th>
                    <th style="width:160px">Utilisateur</th>
                    <th style="width:80px">Rôle</th>
                    <th style="width:110px">Adresse IP</th>
                    <th>Détails</th>
                </tr>
            </ng-template>

            <ng-template pTemplate="body" let-log>
                <tr>
                    <td>
                        <div style="font-size:13px;font-weight:600;">
                            {{ log.timestamp | date:'dd/MM/yyyy' }}
                        </div>
                        <div style="font-size:11px;color:var(--text-color-secondary);">
                            {{ log.timestamp | date:'HH:mm:ss' }}
                        </div>
                    </td>

                    <td>
                        <span class="action-tag" [ngStyle]="getActionStyle(log.action)">
                            <i [class]="getActionIcon(log.action)" aria-hidden="true"></i>
                            {{ getActionLabel(log.action) }}
                        </span>
                    </td>

                    <td>
                        <div style="font-size:13px;font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                             [pTooltip]="log.entityTitle">
                            {{ log.entityTitle || '—' }}
                        </div>
                        <div style="font-size:11px;color:var(--text-color-secondary);">
                            {{ log.entityType }}
                        </div>
                    </td>

                    <td>
                        <div style="font-size:13px;font-weight:600;">{{ log.userFullName || log.userId }}</div>
                        <div style="font-size:11px;color:var(--text-color-secondary);">{{ log.userEmail }}</div>
                    </td>

                    <td>
                        <span style="font-size:11px;background:var(--surface-100);padding:2px 7px;border-radius:8px;">
                            {{ formatRole(log.userRole) }}
                        </span>
                    </td>

                    <td>
                        <span class="ip-chip">{{ log.ipAddress || '—' }}</span>
                    </td>

                    <td>
                        <span style="font-size:12px;color:var(--text-color-secondary);">
                            {{ log.details || '—' }}
                        </span>
                    </td>
                </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="7" class="text-center py-5" style="color:var(--text-color-secondary);">
                        <i class="pi pi-inbox" style="font-size:2rem;display:block;margin-bottom:8px;" aria-hidden="true"></i>
                        Aucune entrée d'audit trouvée
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>
</div>
    `
})
export class AuditLogComponent implements OnInit, OnDestroy {

    readonly Math = Math;
    auditViewMode: 'list' | 'card' = 'card';
    logs: AuditLog[]      = [];
    activeUsers: ActiveUser[] = [];
    totalRecords = 0;
    pageSize     = 20;
    currentPage  = 0;
    loading      = false;

    filterAction = '';
    filterEmail  = '';
    filterFrom:  Date | null = null;
    filterTo:    Date | null = null;

    private emailTimer: any;

    actionOptions = Object.keys(ACTION_LABELS).map(k => ({
        label: ACTION_LABELS[k],
        value: k
    }));

    constructor(private auditService: AuditService) {}

    ngOnInit(): void {
        this.loadAll();
    }

    ngOnDestroy(): void {
        clearTimeout(this.emailTimer);
    }

    loadAll(): void {
        this.loadLogs();
        this.loadActiveUsers();
    }

    loadLogs(): void {
        this.loading = true;
        const from = this.filterFrom ? this.toIso(this.filterFrom, true)  : undefined;
        const to   = this.filterTo   ? this.toIso(this.filterTo,   false) : undefined;

        this.auditService.getPaged(
            this.currentPage, this.pageSize,
            this.filterAction || undefined,
            this.filterEmail  || undefined,
            from, to
        ).subscribe({
            next: (page) => {
                this.logs         = page.content;
                this.totalRecords = page.totalElements;
                this.loading      = false;
            },
            error: () => { this.loading = false; }
        });
    }

    loadActiveUsers(): void {
        this.auditService.getRecentlyActiveUsers().subscribe({
            next: (users) => { this.activeUsers = users; },
            error: () => {}
        });
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        this.currentPage = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize));
        this.pageSize    = event.rows ?? this.pageSize;
        this.loadLogs();
    }

    applyFilters(): void {
        this.currentPage = 0;
        this.loadLogs();
    }

    onEmailInput(): void {
        clearTimeout(this.emailTimer);
        this.emailTimer = setTimeout(() => { this.currentPage = 0; this.loadLogs(); }, 400);
    }

    resetFilters(): void {
        this.filterAction = '';
        this.filterEmail  = '';
        this.filterFrom   = null;
        this.filterTo     = null;
        this.currentPage  = 0;
        this.loadLogs();
    }

    getActionLabel(action: string): string {
        return ACTION_LABELS[action] || action;
    }

    getActionIcon(action: string): string {
        const map: Record<string, string> = {
            CREATION_EVENEMENT:      'pi pi-plus-circle',
            MODIFICATION_EVENEMENT:  'pi pi-pencil',
            SUPPRESSION_CORBEILLE:   'pi pi-trash',
            RESTAURATION_EVENEMENT:  'pi pi-undo',
            SUPPRESSION_DEFINITIVE:  'pi pi-times-circle',
            VALIDATION_EVENEMENT:    'pi pi-check-circle',
            REJET_EVENEMENT:         'pi pi-times',
            DEMANDE_CORRECTIONS:     'pi pi-exclamation-circle',
            SOUMISSION_BROUILLON:    'pi pi-send',
            ANNULATION_EVENEMENT:    'pi pi-ban',
            REPORT_EVENEMENT:        'pi pi-calendar',
            DELEGATION_PARTICIPATION:'pi pi-share-alt',
            AJOUT_PARTICIPANT:       'pi pi-user-plus',
            RETRAIT_PARTICIPANT:     'pi pi-user-minus',
            CONNEXION:               'pi pi-sign-in',
        };
        return map[action] || 'pi pi-circle';
    }

    getActionStyle(action: string): Record<string, string> {
        const colors: Record<string, [string, string]> = {
            CREATION_EVENEMENT:      ['#e8f5e9', '#388e3c'],
            MODIFICATION_EVENEMENT:  ['#e8f5e9', '#1b5e20'],
            SUPPRESSION_CORBEILLE:   ['#fff3e0', '#e65100'],
            RESTAURATION_EVENEMENT:  ['#f3e5f5', '#7b1fa2'],
            SUPPRESSION_DEFINITIVE:  ['#ffebee', '#c62828'],
            VALIDATION_EVENEMENT:    ['#e8f5e9', '#2e7d32'],
            REJET_EVENEMENT:         ['#ffebee', '#c62828'],
            DEMANDE_CORRECTIONS:     ['#fff8e1', '#f57f17'],
            SOUMISSION_BROUILLON:    ['#f1f8e9', '#558b2f'],
            ANNULATION_EVENEMENT:    ['#fce4ec', '#880e4f'],
            DELEGATION_PARTICIPATION:['#e8f5e9', '#2e7d32'],
            AJOUT_PARTICIPANT:       ['#e8f5e9', '#388e3c'],
            RETRAIT_PARTICIPANT:     ['#ffebee', '#c62828'],
        };
        const [bg, color] = colors[action] || ['#f5f5f5', '#616161'];
        return { background: bg, color };
    }

    formatRole(role: string): string {
        return role ? role.replace('ROLE_', '') : '—';
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name[0].toUpperCase();
    }

    private toIso(date: Date, startOfDay: boolean): string {
        const d = new Date(date);
        if (startOfDay) { d.setHours(0, 0, 0, 0); }
        else            { d.setHours(23, 59, 59, 999); }
        return d.toISOString().slice(0, 19);
    }
}
