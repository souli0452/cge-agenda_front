import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { Observable, from, of } from 'rxjs';

export interface HasUnsavedChanges {
    hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
    component: HasUnsavedChanges
): Observable<boolean> => {
    if (!component.hasUnsavedChanges()) {
        return of(true);
    }

    const confirmationService = inject(ConfirmationService);

    return from(
        new Promise<boolean>((resolve) => {
            confirmationService.confirm({
                header:  'Modifications non sauvegardées',
                message: 'Des modifications n\'ont pas été enregistrées. Voulez-vous quitter sans sauvegarder ?',
                icon:    'pi pi-exclamation-triangle',
                acceptLabel:   'Quitter',
                rejectLabel:   'Rester',
                acceptIcon:    'pi pi-sign-out',
                rejectIcon:    'pi pi-times',
                acceptButtonProps: { severity: 'danger' },
                rejectButtonProps: { severity: 'secondary', outlined: true },
                accept:  () => resolve(true),
                reject:  () => resolve(false),
            });
        })
    );
};
