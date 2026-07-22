import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { FormsModule }               from '@angular/forms';

import { ButtonModule }        from 'primeng/button';
import { TableModule }         from 'primeng/table';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { TooltipModule }       from 'primeng/tooltip';
import { SkeletonModule }      from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule }        from 'primeng/select';
import { ToggleSwitchModule }  from 'primeng/toggleswitch';
import { CardModule }          from 'primeng/card';
import { DividerModule }       from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';

import { BackupService, BackupInfo, BackupConfig } from '../../../service/backup.service';

@Component({
    selector: 'app-backup',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        ButtonModule, TableModule, TagModule,
        ToastModule, TooltipModule, SkeletonModule,
        ConfirmDialogModule, SelectModule, ToggleSwitchModule,
        CardModule, DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="backup-page">

    <!-- EN-TÊTE -->
    <div class="card mb-3">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="backup-icon"><i class="pi pi-database"></i></div>
                <div>
                    <h3 class="m-0 text-2xl font-bold">Sauvegardes de la base de données</h3>
                    <p class="m-0 text-sm text-muted-color mt-1">
                        Sauvegarde automatique configurée &bull; Max {{ config.retentionCount }} fichiers conservés
                    </p>
                </div>
            </div>
            <p-button label="Sauvegarder maintenant" icon="pi pi-save"
                [loading]="creating" (onClick)="createBackup()" severity="success">
            </p-button>
        </div>
    </div>

    <!-- CONFIGURATION -->
    <div class="card mb-3">
        <div class="config-header mb-3">
            <i class="pi pi-clock mr-2" style="color: var(--cge-vert-moyen)"></i>
            <span class="font-semibold text-lg">Configuration de la sauvegarde automatique</span>
        </div>
        <div class="config-grid">
            <div class="config-row">
                <div>
                    <div class="font-medium">Sauvegarde automatique</div>
                    <div class="text-sm text-muted-color">Déclencher automatiquement chaque nuit</div>
                </div>
                <p-toggleswitch [(ngModel)]="config.autoEnabled"></p-toggleswitch>
            </div>
            <p-divider></p-divider>
            <div class="config-row" [class.config-disabled]="!config.autoEnabled">
                <div>
                    <div class="font-medium">Heure de sauvegarde</div>
                    <div class="text-sm text-muted-color">La sauvegarde se lancera chaque jour à cette heure</div>
                </div>
                <p-select [(ngModel)]="config.backupHour" [options]="hourOptions"
                    optionLabel="label" optionValue="value"
                    [style]="{ width: '130px' }" [disabled]="!config.autoEnabled">
                </p-select>
            </div>
            <p-divider></p-divider>
            <div class="config-row">
                <div>
                    <div class="font-medium">Nombre de sauvegardes à conserver</div>
                    <div class="text-sm text-muted-color">Les plus anciennes seront supprimées automatiquement</div>
                </div>
                <p-select [(ngModel)]="config.retentionCount" [options]="retentionOptions"
                    optionLabel="label" optionValue="value" [style]="{ width: '130px' }">
                </p-select>
            </div>
        </div>
        <div class="flex justify-end mt-4">
            <p-button label="Enregistrer" icon="pi pi-check"
                [loading]="savingConfig" (onClick)="saveConfig()" severity="success">
            </p-button>
        </div>
    </div>

    <!-- LISTE DES SAUVEGARDES -->
    <div class="card">
        <div class="config-header mb-3">
            <i class="pi pi-list mr-2" style="color: var(--cge-vert-moyen)"></i>
            <span class="font-semibold text-lg">Fichiers de sauvegarde ({{ backups.length }})</span>
        </div>

        @if (loading) {
            <div class="flex flex-col gap-3">
                @for (_ of skeletons; track $index) {
                    <p-skeleton height="48px" borderRadius="8px"></p-skeleton>
                }
            </div>
        } @else if (backups.length === 0) {
            <div class="empty-state">
                <i class="pi pi-inbox text-5xl text-muted-color mb-3"></i>
                <p class="text-muted-color">Aucune sauvegarde disponible. Cliquez sur "Sauvegarder maintenant".</p>
            </div>
        } @else {
            <p-table [value]="backups" [paginator]="backups.length > 10" [rows]="10"
                styleClass="p-datatable-sm p-datatable-striped" responsiveLayout="scroll">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Fichier</th>
                        <th>Date</th>
                        <th>Taille</th>
                        <th>Type</th>
                        <th>Créé par</th>
                        <th class="text-center">Actions</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-b>
                    <tr>
                        <td><span class="font-mono text-sm">{{ b.filename }}</span></td>
                        <td>{{ b.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>{{ b.sizeFormatted }}</td>
                        <td><p-tag [value]="b.type" [severity]="b.type === 'AUTO' ? 'info' : 'success'"></p-tag></td>
                        <td>{{ b.createdBy || '—' }}</td>
                        <td>
                            <div class="flex justify-center gap-2">
                                <p-button icon="pi pi-download" severity="secondary" size="small" [outlined]="true" pTooltip="Télécharger" [loading]="downloading === b.filename" (onClick)="downloadBackup(b)"></p-button>
                                <p-button icon="pi pi-replay" severity="warn" size="small" [outlined]="true" pTooltip="Restaurer la base" [loading]="restoring === b.filename" (onClick)="confirmRestore(b)"></p-button>
                                <p-button icon="pi pi-trash" severity="danger" size="small" [outlined]="true" pTooltip="Supprimer" (onClick)="confirmDelete(b)"></p-button>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        }
    </div>

</div>
    `,
    styles: [`
.backup-page { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }

.backup-icon {
    width: 52px; height: 52px;
    background: var(--cge-vert-clair, var(--cge-vert-clair));
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
.backup-icon i { font-size: 1.5rem; color: var(--cge-vert-moyen, var(--cge-vert-moyen)); }

.config-header { display: flex; align-items: center; }
.config-grid { display: flex; flex-direction: column; }
.config-row {
    display: flex; align-items: center;
    justify-content: space-between; gap: 16px; padding: 10px 0;
}
.config-disabled { opacity: 0.45; pointer-events: none; }

.empty-state {
    display: flex; flex-direction: column;
    align-items: center; padding: 3rem 2rem; text-align: center;
}

.tab-count {
    background: var(--primary-color, var(--cge-vert-moyen));
    color: white; border-radius: 10px;
    padding: 1px 7px; font-size: 0.7rem; font-weight: 600;
}
.corbeille-count { background: var(--red-500, #ef4444); }

.alert-purge {
    background: #fff3e0; border: 1px solid #ffcc80;
    border-radius: 8px; padding: 0.75rem 1rem;
    display: flex; align-items: center;
    color: #e65100; font-size: 0.9rem;
}

.font-mono { font-family: 'Fira Code', 'Courier New', monospace; font-size: 0.8rem; }

@media (max-width: 768px) {
    .backup-page { padding: 0.75rem; }
    .config-row { flex-direction: column; align-items: flex-start; gap: 8px; }
}
    `]
})
export class BackupComponent implements OnInit {
    private backupService  = inject(BackupService);
    private messageService = inject(MessageService);
    private confirmService = inject(ConfirmationService);

    backups: BackupInfo[] = [];
    config: BackupConfig  = { autoEnabled: true, backupHour: 2, backupMinute: 0, retentionCount: 30 };

    loading      = true;
    creating     = false;
    savingConfig = false;
    restoring: string | null   = null;
    downloading: string | null = null;

    readonly skeletons = Array(5).fill(null);

    readonly hourOptions = Array.from({ length: 24 }, (_, i) => ({
        value: i, label: `${i.toString().padStart(2, '0')}:00`
    }));

    readonly retentionOptions = [7, 10, 15, 20, 30, 60, 90].map(n => ({
        value: n, label: `${n} fichiers`
    }));

    ngOnInit() {
        this.loadBackups();
        this.loadConfig();
    }

    loadBackups() {
        this.loading = true;
        this.backupService.list().subscribe({
            next:  b  => { this.backups = b; this.loading = false; },
            error: () => { this.loading = false; this.toast('error', 'Impossible de charger les sauvegardes'); }
        });
    }

    loadConfig() {
        this.backupService.getConfig().subscribe({ next: c => this.config = c, error: () => {} });
    }

    saveConfig() {
        this.savingConfig = true;
        this.backupService.saveConfig(this.config).subscribe({
            next: c => {
                this.config = c;
                this.savingConfig = false;
                this.toast('success', `Configuration enregistrée — sauvegarde à ${c.backupHour.toString().padStart(2,'0')}:00`);
            },
            error: () => { this.savingConfig = false; this.toast('error', 'Impossible de sauvegarder la configuration'); }
        });
    }

    createBackup() {
        this.creating = true;
        this.backupService.create().subscribe({
            next: b => { this.creating = false; this.backups.unshift(b); this.toast('success', `Sauvegarde créée : ${b.filename} (${b.sizeFormatted})`); },
            error: err => { this.creating = false; this.toast('error', err.error?.error || 'Échec de la sauvegarde'); }
        });
    }

    downloadBackup(b: BackupInfo) {
        this.downloading = b.filename;
        this.backupService.download(b.filename).subscribe({
            next: blob => {
                this.downloading = null;
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = b.filename;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: () => { this.downloading = null; this.toast('error', 'Impossible de télécharger'); }
        });
    }

    confirmRestore(b: BackupInfo) {
        this.confirmService.confirm({
            header: 'Restaurer la base de données ?',
            message: `Cette action va écraser TOUTES les données actuelles par celles du fichier :<br><b>${b.filename}</b><br><br>Cette opération est irréversible.`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Oui, restaurer', rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.restoring = b.filename;
                this.backupService.restore(b.filename).subscribe({
                    next: r => { this.restoring = null; this.toast('success', r.message); },
                    error: err => { this.restoring = null; this.toast('error', err.error?.error || 'Échec de la restauration'); }
                });
            }
        });
    }

    confirmDelete(b: BackupInfo) {
        this.confirmService.confirm({
            header: 'Supprimer cette sauvegarde ?',
            message: `<b>${b.filename}</b> sera supprimé définitivement.<br><span style="color:#c62828;font-size:13px;">Cette action est irréversible.</span>`,
            icon: 'pi pi-trash',
            acceptLabel: 'Supprimer', rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.backupService.delete(b.filename).subscribe({
                    next: () => { this.backups = this.backups.filter(x => x.filename !== b.filename); this.toast('success', 'Sauvegarde supprimée'); },
                    error: err => this.toast('error', err.error?.error || 'Impossible de supprimer')
                });
            }
        });
    }

    private toast(severity: string, detail: string) {
        this.messageService.add({ severity, summary: severity === 'error' ? 'Erreur' : 'Succès', detail, life: 5000 });
    }
}
