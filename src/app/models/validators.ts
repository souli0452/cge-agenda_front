import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const endDateAfterStart: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('startDate')?.value;
    const end   = group.get('endDate')?.value;
    if (!start || !end) return null;
    return new Date(end) >= new Date(start) ? null : { endBeforeStart: true };
};
