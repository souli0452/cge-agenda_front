import { Component, OnInit, SecurityContext } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient }        from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ButtonModule }      from 'primeng/button';
import { InputTextModule }   from 'primeng/inputtext';
import { TabsModule }        from 'primeng/tabs';
import { DividerModule }     from 'primeng/divider';
import { ToastModule }       from 'primeng/toast';
import { DialogModule }      from 'primeng/dialog';
import { SkeletonModule }    from 'primeng/skeleton';
import { TooltipModule }     from 'primeng/tooltip';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToggleSwitch }      from 'primeng/toggleswitch';
import { Select }            from 'primeng/select';
import { Textarea }          from 'primeng/textarea';
import { MessageService }    from 'primeng/api';

import { environments }             from '../../../../environments/environments';
import { SchedulerConfigService, SchedulerConfig } from '../../../service/scheduler-config.service';

interface OrgConfig {
    id?:                       string;
    nomOrganisation:           string;
    slogan:                    string;
    emailExpediteurNom:        string;
    couleurPrimaire:           string;
    logoUrl:                   string;
    adresse:                   string;
    siteWeb:                   string;
    subjectInvitation:         string;
    subjectValidationRequest:  string;
    subjectNewDocument:        string;
    subjectRejected:           string;
    subjectChangesRequested:   string;
    subjectAmendmentsCorrected:string;
    subjectCancellation:       string;
    subjectPostponement:       string;
    subjectEventUpdate:        string;
    subjectReminder:           string;
    subjectDelegation:         string;
    bodyInvitation:            string;
    bodyValidationRequest:     string;
    bodyNewDocument:           string;
    bodyRejected:              string;
    bodyChangesRequested:      string;
    bodyAmendmentsCorrected:   string;
    bodyCancellation:          string;
    bodyPostponement:          string;
    bodyEventUpdate:           string;
    bodyReminder:              string;
    bodyDelegation:            string;
    updatedAt?:                string;
}

interface EmailTemplate {
    key:         string;
    field:       keyof OrgConfig;
    bodyField:   keyof OrgConfig;
    label:       string;
    icon:        string;
    iconColor:   string;
    description: string;
}

@Component({
    selector:   'app-org-config',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, InputTextModule, TabsModule,
        DividerModule, ToastModule, DialogModule,
        SkeletonModule, TooltipModule, ColorPickerModule,
        ToggleSwitch, Select, Textarea
    ],
    providers: [MessageService],
    styleUrls: ['./org-config.css'],
    template: `
<p-toast position="top-right"></p-toast>

<div class="config-container">

    <!-- EN-TÊTE -->
    <div class="page-header">
        <div class="header-left">
            <div class="header-icon">
                <i class="pi pi-building"></i>
            </div>
            <div>
                <h1 class="page-title">Configuration système</h1>
                <p class="page-subtitle">Organisation et templates d'emails</p>
            </div>
        </div>
        <p-button
            label="Enregistrer tout"
            icon="pi pi-save"
            severity="success"
            [loading]="saving"
            (onClick)="save()" />
    </div>

    <!-- TABS -->
    <p-tabs [(value)]="activeTab">

        <p-tablist>
            <p-tab value="0"><i class="pi pi-building" style="margin-right:6px"></i>Organisation</p-tab>
            <p-tab value="1"><i class="pi pi-envelope" style="margin-right:6px"></i>Modèles d'emails</p-tab>
            <p-tab value="2"><i class="pi pi-bell" style="margin-right:6px"></i>Rappels automatiques</p-tab>
        </p-tablist>

        <p-tabpanels>
        <p-tabpanel value="0">

            <div *ngIf="loading" class="skeleton-form">
                <p-skeleton height="44px" styleClass="mb-3" *ngFor="let i of [1,2,3,4,5,6]" />
            </div>

            <div *ngIf="!loading" class="org-form">

                <div class="form-section">
                    <h3 class="section-title">Identité</h3>

                    <div class="form-grid-2">
                        <div class="form-field">
                            <label class="field-label">Nom de l'organisation <span class="req">*</span></label>
                            <input pInputText [(ngModel)]="config.nomOrganisation"
                                   placeholder="Ex: ASCELC" class="w-full" />
                        </div>
                        <div class="form-field">
                            <label class="field-label">Nom expéditeur email</label>
                            <input pInputText [(ngModel)]="config.emailExpediteurNom"
                                   placeholder="Ex: CGE Agenda" class="w-full" />
                            <small class="field-hint">Affiché dans le champ "De :" des emails</small>
                        </div>
                    </div>

                    <div class="form-field">
                        <label class="field-label">Slogan / Sous-titre</label>
                        <input pInputText [(ngModel)]="config.slogan"
                               placeholder="Ex: Autorité Supérieure de Contrôle d'État..."
                               class="w-full" />
                    </div>

                    <div class="form-grid-2">
                        <div class="form-field">
                            <label class="field-label">Adresse</label>
                            <input pInputText [(ngModel)]="config.adresse"
                                   placeholder="Ex: Burkina Faso" class="w-full" />
                        </div>
                        <div class="form-field">
                            <label class="field-label">Site web</label>
                            <input pInputText [(ngModel)]="config.siteWeb"
                                   placeholder="Ex: https://ascelc.bf" class="w-full" />
                        </div>
                    </div>
                </div>

                <p-divider />

                <div class="form-section">
                    <h3 class="section-title">Apparence emails</h3>

                    <div class="form-grid-2">
                        <div class="form-field">
                            <label class="field-label">Couleur principale</label>
                            <div class="color-row">
                                <p-colorPicker [(ngModel)]="config.couleurPrimaire"
                                               format="hex"
                                               appendTo="body" />
                                <input pInputText [(ngModel)]="config.couleurPrimaire"
                                       placeholder="#009640" style="flex:1" />
                                <div class="color-preview"
                                     [style.background]="config.couleurPrimaire">
                                </div>
                            </div>
                            <small class="field-hint">Couleur de la bannière des emails</small>
                        </div>
                        <div class="form-field">
                            <label class="field-label">URL du logo</label>
                            <input pInputText [(ngModel)]="config.logoUrl"
                                   placeholder="https://..." class="w-full" />
                            <small class="field-hint">URL publique de l'image (PNG/SVG recommandé)</small>
                        </div>
                    </div>

                    <!-- Aperçu bannière email -->
                    <div class="banner-preview"
                         [style.background]="'linear-gradient(135deg, ' + darken(config.couleurPrimaire) + ', ' + config.couleurPrimaire + ')'">
                        <img *ngIf="config.logoUrl" [src]="config.logoUrl"
                             style="max-height:40px; margin-bottom:8px; filter:drop-shadow(0 1px 4px rgba(0,0,0,0.3))" />
                        <div class="banner-preview-title">{{ config.nomOrganisation }}</div>
                        <div class="banner-preview-sub">{{ config.slogan }}</div>
                    </div>
                </div>

                <div class="last-saved" *ngIf="config.updatedAt">
                    <i class="pi pi-history"></i>
                    Dernière modification : {{ config.updatedAt | date:'dd/MM/yyyy à HH:mm' }}
                </div>
            </div>
        </p-tabpanel>

        <p-tabpanel value="1">

            <div class="subjects-hint">
                <i class="pi pi-info-circle"></i>
                Utilisez <code>{{ '{' }}titre{{ '}' }}</code> pour insérer le titre de l'événement dans le sujet et le corps du message.
            </div>

            <div *ngIf="loading" class="skeleton-form">
                <p-skeleton height="44px" styleClass="mb-3" *ngFor="let i of [1,2,3,4,5]" />
            </div>

            <div *ngIf="!loading" class="templates-list">
                <div *ngFor="let tpl of emailTemplates" class="template-row">
                    <div class="template-top">
                        <div class="template-meta">
                            <div class="template-icon-wrap" [style.background]="tpl.iconColor + '20'">
                                <i [class]="tpl.icon" [style.color]="tpl.iconColor"></i>
                            </div>
                            <div class="template-info">
                                <div class="template-label">{{ tpl.label }}</div>
                                <div class="template-desc">{{ tpl.description }}</div>
                            </div>
                        </div>
                        <div class="template-subject-wrap">
                            <input pInputText
                                   [(ngModel)]="config[tpl.field]"
                                   [placeholder]="'Sujet : ' + tpl.label"
                                   class="template-subject-input" />
                            <p-button
                                icon="pi pi-eye"
                                [rounded]="true"
                                [text]="true"
                                severity="secondary"
                                size="small"
                                pTooltip="Prévisualiser le template"
                                tooltipPosition="left"
                                (onClick)="openPreview(tpl.key)" />
                        </div>
                    </div>
                    <div class="template-body-wrap">
                        <textarea pTextarea
                                  [(ngModel)]="config[tpl.bodyField]"
                                  [placeholder]="'Corps du message : ' + tpl.label"
                                  rows="2"
                                  autoResize="true"
                                  class="template-body-input"></textarea>
                    </div>
                </div>
            </div>
        </p-tabpanel>
        <p-tabpanel value="2">

            <div *ngIf="loadingScheduler" class="skeleton-form">
                <p-skeleton height="44px" styleClass="mb-3" *ngFor="let i of [1,2,3]" />
            </div>

            <div *ngIf="!loadingScheduler" class="scheduler-form">

                <!-- Activer / Désactiver -->
                <div class="scheduler-toggle-row">
                    <div>
                        <h3 class="section-title" style="margin:0">Rappels par email</h3>
                        <p class="field-hint" style="margin-top:4px">
                            Envoi automatique d'emails de rappel aux participants avant chaque événement planifié
                        </p>
                    </div>
                    <p-toggleswitch [(ngModel)]="schedulerConfig.reminderEnabled" />
                </div>

                <p-divider />

                <div [class.scheduler-disabled]="!schedulerConfig.reminderEnabled">

                    <!-- Heure d'envoi -->
                    <div class="form-section">
                        <h3 class="section-title">Heure d'envoi quotidien</h3>
                        <div class="form-field" style="max-width:220px">
                            <p-select
                                [(ngModel)]="schedulerConfig.sendHour"
                                [options]="hourOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Sélectionner une heure"
                                class="w-full" />
                            <small class="field-hint">Le scheduler s'exécute chaque jour à cette heure</small>
                        </div>
                    </div>

                    <p-divider />

                    <!-- Jours de rappel -->
                    <div class="form-section">
                        <h3 class="section-title">Jours de rappel avant l'événement</h3>
                        <p class="field-hint" style="margin-bottom:16px">
                            Sélectionnez les jours pour lesquels un rappel est envoyé aux participants (au moins 1)
                        </p>
                        <div class="days-grid">
                            <div *ngFor="let day of availableDays"
                                 class="day-option"
                                 [class.day-selected]="isDaySelected(day.value)"
                                 (click)="toggleDay(day.value)"
                                 [attr.aria-pressed]="isDaySelected(day.value)"
                                 role="button"
                                 [attr.aria-label]="'J-' + day.value + ' : ' + day.label">
                                <span class="day-num">J-{{ day.value }}</span>
                                <span class="day-lbl">{{ day.label }}</span>
                            </div>
                        </div>
                    </div>

                </div>

                <p-divider />

                <!-- Statut + Actions -->
                <div class="scheduler-status-row">
                    <div class="scheduler-status-info" *ngIf="schedulerConfig.nextScheduledRun">
                        <i class="pi pi-clock" style="color:#009640"></i>
                        <span>{{ schedulerConfig.nextScheduledRun }}</span>
                        <span *ngIf="schedulerConfig.updatedAt" class="update-meta">
                            · Modifié le {{ schedulerConfig.updatedAt | date:'dd/MM/yyyy HH:mm' }}
                            <span *ngIf="schedulerConfig.updatedBy"> par {{ schedulerConfig.updatedBy }}</span>
                        </span>
                    </div>
                    <div class="scheduler-actions">
                        <p-button
                            label="Tester maintenant"
                            icon="pi pi-play"
                            severity="secondary"
                            [outlined]="true"
                            [loading]="runningNow"
                            pTooltip="Déclenche l'envoi des rappels immédiatement (pour tester)"
                            (onClick)="runSchedulerNow()" />
                        <p-button
                            label="Enregistrer"
                            icon="pi pi-save"
                            severity="success"
                            [loading]="savingScheduler"
                            (onClick)="saveSchedulerConfig()" />
                    </div>
                </div>

            </div>
        </p-tabpanel>

        </p-tabpanels>
    </p-tabs>
</div>

<!-- DIALOG PREVIEW -->
<p-dialog
    [(visible)]="previewVisible"
    [modal]="true"
    [style]="{width: '720px', 'max-height': '90vh'}"
    header="Aperçu du template email"
    [draggable]="false"
    [resizable]="true">

    <div *ngIf="previewLoading" style="padding:40px; text-align:center">
        <i class="pi pi-spin pi-spinner" style="font-size:2rem; color:#009640"></i>
        <p style="margin-top:12px; color:#666">Rendu en cours...</p>
    </div>

    <iframe *ngIf="!previewLoading && previewHtml"
            [srcdoc]="previewHtml"
            style="width:100%; height:520px; border:none; border-radius:8px;"
            sandbox="allow-same-origin">
    </iframe>

    <ng-template pTemplate="footer">
        <p-button
            label="Fermer"
            [text]="true"
            severity="secondary"
            (onClick)="previewVisible = false" />
    </ng-template>
</p-dialog>
    `,
})
export class OrgConfigComponent implements OnInit {

    activeTab    = '0';
    loading      = true;
    saving       = false;
    previewVisible = false;
    previewLoading = false;
    previewHtml    = '';

    config: OrgConfig = {
        nomOrganisation: '', slogan: '', emailExpediteurNom: '',
        couleurPrimaire: '#009640', logoUrl: '', adresse: '', siteWeb: '',
        subjectInvitation: '', subjectValidationRequest: '', subjectNewDocument: '',
        subjectRejected: '', subjectChangesRequested: '', subjectAmendmentsCorrected: '',
        subjectCancellation: '', subjectPostponement: '', subjectEventUpdate: '',
        subjectReminder: '', subjectDelegation: '',
        bodyInvitation: '', bodyValidationRequest: '', bodyNewDocument: '',
        bodyRejected: '', bodyChangesRequested: '', bodyAmendmentsCorrected: '',
        bodyCancellation: '', bodyPostponement: '', bodyEventUpdate: '',
        bodyReminder: '', bodyDelegation: ''
    };

    emailTemplates: EmailTemplate[] = [
        { key: 'invitation',          field: 'subjectInvitation',          bodyField: 'bodyInvitation',          label: 'Invitation',               icon: 'pi pi-calendar-plus',   iconColor: '#009640', description: 'Envoyé quand un participant est invité à un événement' },
        { key: 'validation-request',  field: 'subjectValidationRequest',   bodyField: 'bodyValidationRequest',   label: 'Demande de validation',    icon: 'pi pi-send',            iconColor: '#ff9800', description: 'Envoyé aux CGE pour valider un nouvel événement' },
        { key: 'new-document',        field: 'subjectNewDocument',         bodyField: 'bodyNewDocument',         label: 'Nouveau document disponible', icon: 'pi pi-file',         iconColor: 'var(--cge-vert-moyen)', description: 'Un nouveau document est disponible pour l\'événement' },
        { key: 'rejected',            field: 'subjectRejected',            bodyField: 'bodyRejected',            label: 'Événement rejeté',         icon: 'pi pi-times-circle',    iconColor: '#f44336', description: 'L\'organisateur est notifié du rejet' },
        { key: 'changes-requested',   field: 'subjectChangesRequested',    bodyField: 'bodyChangesRequested',    label: 'Corrections demandées',    icon: 'pi pi-pencil',          iconColor: '#9c27b0', description: 'Le CGE demande des corrections à l\'organisateur' },
        { key: 'amendments-corrected',field: 'subjectAmendmentsCorrected', bodyField: 'bodyAmendmentsCorrected', label: 'Corrections apportées',   icon: 'pi pi-check',           iconColor: '#2196F3', description: 'L\'organisateur a apporté les corrections demandées' },
        { key: 'cancellation',        field: 'subjectCancellation',        bodyField: 'bodyCancellation',        label: 'Annulation',               icon: 'pi pi-ban',             iconColor: '#f44336', description: 'Participants notifiés de l\'annulation' },
        { key: 'postponement',        field: 'subjectPostponement',        bodyField: 'bodyPostponement',        label: 'Report',                   icon: 'pi pi-calendar',        iconColor: '#ff9800', description: 'Participants notifiés du report de l\'événement' },
        { key: 'event-update',        field: 'subjectEventUpdate',         bodyField: 'bodyEventUpdate',         label: 'Mise à jour',              icon: 'pi pi-refresh',         iconColor: '#607d8b', description: 'Modification d\'un événement déjà planifié' },
        { key: 'reminder',            field: 'subjectReminder',            bodyField: 'bodyReminder',            label: 'Rappel',                   icon: 'pi pi-clock',           iconColor: '#ff9800', description: 'Rappel automatique avant l\'événement' },
        { key: 'delegation',          field: 'subjectDelegation',          bodyField: 'bodyDelegation',          label: 'Délégation',               icon: 'pi pi-user-edit',       iconColor: '#00bcd4', description: 'Notification de délégation de participation' },
    ];

    loadingScheduler  = true;
    savingScheduler   = false;
    runningNow        = false;

    schedulerConfig: SchedulerConfig = {
        reminderEnabled: true,
        sendHour:        7,
        reminderDays:    [1, 7]
    };

    readonly hourOptions = Array.from({ length: 24 }, (_, i) => ({
        value: i,
        label: `${i.toString().padStart(2, '0')}:00`
    }));

    readonly availableDays = [
        { value: 1,  label: 'Veille'     },
        { value: 3,  label: '3 jours'    },
        { value: 5,  label: '5 jours'    },
        { value: 7,  label: '1 semaine'  },
        { value: 14, label: '2 semaines' },
        { value: 30, label: '1 mois'     }
    ];

    isDaySelected(day: number): boolean {
        return this.schedulerConfig.reminderDays.includes(day);
    }

    toggleDay(day: number): void {
        const selected = this.schedulerConfig.reminderDays;
        if (selected.includes(day)) {
            if (selected.length > 1) {
                this.schedulerConfig.reminderDays = selected.filter(d => d !== day);
            }
        } else {
            this.schedulerConfig.reminderDays = [...selected, day].sort((a, b) => a - b);
        }
    }

    saveSchedulerConfig(): void {
        this.savingScheduler = true;
        this.schedulerConfigService.updateConfig(this.schedulerConfig).subscribe({
            next: (c) => {
                this.schedulerConfig  = c;
                this.savingScheduler  = false;
                this.messageService.add({
                    severity: 'success', summary: 'Enregistré',
                    detail: 'Configuration des rappels mise à jour et reprogrammée', life: 3000
                });
            },
            error: () => {
                this.savingScheduler = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder' });
            }
        });
    }

    runSchedulerNow(): void {
        this.runningNow = true;
        this.schedulerConfigService.runNow().subscribe({
            next: (r) => {
                this.runningNow = false;
                this.messageService.add({
                    severity: 'success', summary: 'Rappels envoyés',
                    detail: r.message, life: 5000
                });
            },
            error: () => {
                this.runningNow = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de déclencher les rappels' });
            }
        });
    }

    constructor(
        private http:                   HttpClient,
        private messageService:         MessageService,
        private sanitizer:              DomSanitizer,
        private schedulerConfigService: SchedulerConfigService
    ) {}

    ngOnInit(): void {
        this.http.get<OrgConfig>(`${environments.apiUrl}/admin/config`).subscribe({
            next:  (c) => { this.config = c; this.loading = false; },
            error: ()  => { this.loading = false; }
        });
        this.schedulerConfigService.getConfig().subscribe({
            next:  (c) => { this.schedulerConfig = c; this.loadingScheduler = false; },
            error: ()  => { this.loadingScheduler = false; }
        });
    }

    save(): void {
        this.saving = true;
        this.http.put<OrgConfig>(`${environments.apiUrl}/admin/config`, this.config).subscribe({
            next: (c) => {
                this.config = c;
                this.saving = false;
                this.messageService.add({ severity: 'success', summary: 'Enregistré', detail: 'Configuration mise à jour', life: 3000 });
            },
            error: () => {
                this.saving = false;
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'enregistrer la configuration' });
            }
        });
    }

    openPreview(templateKey: string): void {
        this.previewHtml    = '';
        this.previewLoading = true;
        this.previewVisible = true;
        this.http.get(
            `${environments.apiUrl}/admin/config/preview/${templateKey}`,
            { responseType: 'text' }
        ).subscribe({
            next: (html) => {
                this.previewHtml    = html;
                this.previewLoading = false;
            },
            error: () => {
                this.previewHtml    = '<p style="color:red;padding:20px">Erreur lors du rendu du template.</p>';
                this.previewLoading = false;
            }
        });
    }

    darken(hex: string): string {
        if (!hex || hex.length < 7) return '#006e2f';
        try {
            const r = Math.max(0, parseInt(hex.slice(1,3), 16) - 40);
            const g = Math.max(0, parseInt(hex.slice(3,5), 16) - 40);
            const b = Math.max(0, parseInt(hex.slice(5,7), 16) - 40);
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        } catch { return hex; }
    }
}
