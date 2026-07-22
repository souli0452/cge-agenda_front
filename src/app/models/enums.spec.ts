import { EventStatus, EventType, getEventStatusSeverity, getEventTypeSeverity, EVENT_STATUS_OPTIONS, EVENT_TYPE_OPTIONS } from './enums';

/**
 * Ces fonctions ont été la cause directe de deux bugs réels cette session
 * (event-report.ts avait un statut 'VALIDE' inexistant, participant-detail.ts
 * utilisait 'ANNULE' au lieu de 'ANNULER') : on verrouille leur comportement
 * pour toutes les vraies valeurs d'enum afin d'éviter une régression future.
 */
describe('getEventStatusSeverity', () => {
    const allStatuses = Object.values(EventStatus);

    it('couvre bien les 9 statuts réels', () => {
        expect(allStatuses.length).toBe(9);
    });

    it('retourne une sévérité définie (pas le fallback "info") pour chaque statut réel', () => {
        const noFallback = ['TERMINE', 'ANNULER', 'REJETE', 'A_CORRIGER']; // ne doivent jamais être 'info'
        for (const status of allStatuses) {
            const severity = getEventStatusSeverity(status);
            expect(severity).toBeTruthy();
            if (noFallback.includes(status)) {
                expect(severity).not.toBe('info');
            }
        }
    });

    it('un statut inconnu retombe sur "info" (comportement de fallback attendu)', () => {
        expect(getEventStatusSeverity('VALIDE' as any)).toBe('info');
        expect(getEventStatusSeverity('ANNULE' as any)).toBe('info');
    });

    it('ANNULER (et non ANNULE) est bien mappé sur "danger"', () => {
        expect(getEventStatusSeverity('ANNULER')).toBe('danger');
    });
});

describe('getEventTypeSeverity', () => {
    const allTypes = Object.values(EventType);

    it('couvre bien les 8 types réels', () => {
        expect(allTypes.length).toBe(8);
    });

    it('retourne une sévérité pour chaque type réel', () => {
        for (const type of allTypes) {
            expect(getEventTypeSeverity(type)).toBeTruthy();
        }
    });
});

describe('EVENT_STATUS_OPTIONS / EVENT_TYPE_OPTIONS', () => {
    it('EVENT_STATUS_OPTIONS ne contient que des valeurs du vrai enum EventStatus', () => {
        const realValues = new Set(Object.values(EventStatus));
        for (const option of EVENT_STATUS_OPTIONS) {
            expect(realValues.has(option.value)).toBeTrue();
        }
    });

    it('EVENT_STATUS_OPTIONS couvre bien tous les statuts réels (aucun oubli)', () => {
        const optionValues = new Set(EVENT_STATUS_OPTIONS.map(o => o.value));
        for (const status of Object.values(EventStatus)) {
            expect(optionValues.has(status)).toBeTrue();
        }
    });

    it('EVENT_TYPE_OPTIONS ne contient que des valeurs du vrai enum EventType', () => {
        const realValues = new Set(Object.values(EventType));
        for (const option of EVENT_TYPE_OPTIONS) {
            expect(realValues.has(option.value)).toBeTrue();
        }
    });
});
