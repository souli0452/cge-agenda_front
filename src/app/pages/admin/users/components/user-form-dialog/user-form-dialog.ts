import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';

const ROLE_OPTIONS = [
    { label: 'Administrateur',      value: 'ADMIN' },
    { label: 'CGE',                 value: 'CGE' },
    { label: 'Directeur Cabinet',   value: 'DIRECTEUR_CABINET' },
    { label: 'Protocole',           value: 'PROTOCOLE' },
    { label: 'Secrétaire',          value: 'SECRETAIRE' },
    { label: 'Délégué',             value: 'DELEGUE' },
    { label: 'Utilisateur',         value: 'USER' }
];

@Component({
    selector: 'app-user-form-dialog',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        Dialog, ButtonModule, InputTextModule,
        SelectModule, DividerModule, TooltipModule, CheckboxModule
    ],
    templateUrl: './user-form-dialog.html',
    styles: [`
        .password-row { display: flex; align-items: center; gap: 6px; }
        .password-row input { flex: 1; }
    `]
})
export class UserFormDialogComponent implements OnChanges {
    @Input() user:     any | null = null;
    @Input() visible   = false;
    @Input() editMode  = false;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save          = new EventEmitter<any>();
    @Output() cancelled     = new EventEmitter<void>();

    form!: FormGroup;
    roleOptions = ROLE_OPTIONS;

    constructor(private fb: FormBuilder) { this.buildForm(null); }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user'] || changes['visible']) {
            this.buildForm(this.user);
        }
    }

    private buildForm(user: any | null): void {
        this.form = this.fb.group({
            username:  [{ value: user?.username || '', disabled: this.editMode },
                        [Validators.required, Validators.minLength(3)]],
            email:     [user?.email     || '', [Validators.required, Validators.email]],
            firstName: [user?.firstName || '', Validators.required],
            lastName:  [user?.lastName  || '', Validators.required],
            role:      [user?.realmRoles?.[0] || user?.roles?.[0] || '', Validators.required],
            enabled:   [user?.enabled ?? true],
            password:  [{ value: '', disabled: this.editMode },
                        this.editMode ? [] : [Validators.required, Validators.minLength(8)]],
            requireMfa: [user?.mfaRequired ?? false]
        });
    }

    readonly defaultPassword = 'Asce@2026';

    useDefaultPassword(): void {
        this.form.get('password')?.setValue(this.defaultPassword);
        this.form.get('password')?.markAsDirty();
    }

    submit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.save.emit(this.form.getRawValue());
        this.close();
    }

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.cancelled.emit();
    }
}
