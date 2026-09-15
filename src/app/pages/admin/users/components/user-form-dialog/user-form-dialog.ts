import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { isTechnicalRole } from '../../../../../models';

/**
 * Doit correspondre exactement a la politique de mot de passe du realm
 * Keycloak (length(8) + specialChars(1) + upperCase(1) + digits(1)) : sinon
 * un mot de passe valide selon ce formulaire peut quand meme etre rejete par
 * Keycloak a la creation/reinitialisation.
 */
const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

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
    styleUrls: ['./user-form-dialog.css']
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
    showPassword = false;
    showConfirmPassword = false;

    constructor(private fb: FormBuilder) { this.buildForm(null); }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user'] || changes['visible']) {
            this.buildForm(this.user);
        }
    }

    /** Premier rôle métier assignable (ignore les rôles internes Keycloak). */
    private currentBusinessRole(user: any | null): string {
        const roles: string[] = user?.realmRoles ?? user?.roles ?? [];
        return roles.find(r => !isTechnicalRole(r)) || '';
    }

    private buildForm(user: any | null): void {
        this.showPassword = false;
        this.showConfirmPassword = false;
        this.form = this.fb.group({
            username:  [{ value: user?.username || '', disabled: this.editMode },
                        [Validators.required, Validators.minLength(3)]],
            email:     [user?.email     || '', [Validators.required, Validators.email]],
            firstName: [user?.firstName || '', Validators.required],
            lastName:  [user?.lastName  || '', Validators.required],
            role:      [this.currentBusinessRole(user), Validators.required],
            enabled:   [user?.enabled ?? true],
            password:  [{ value: '', disabled: this.editMode },
                        this.editMode ? [] : [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
            confirmPassword: [{ value: '', disabled: this.editMode },
                        this.editMode ? [] : [Validators.required]],
            requireMfa: [user?.mfaRequired ?? false]
        }, { validators: this.editMode ? [] : [passwordsMatchValidator] });
    }

    readonly defaultPassword = 'Asce@2026';

    useDefaultPassword(): void {
        this.form.get('password')?.setValue(this.defaultPassword);
        this.form.get('password')?.markAsDirty();
        this.form.get('confirmPassword')?.setValue(this.defaultPassword);
        this.form.get('confirmPassword')?.markAsDirty();
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
