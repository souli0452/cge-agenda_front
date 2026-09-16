import { getAllCountries, getCitiesOfCountry } from './geo-data';

describe('geo-data', () => {
    describe('getAllCountries', () => {
        it('retourne une liste de pays avec le Burkina Faso en tête (pays prioritaire)', () => {
            const countries = getAllCountries();
            expect(countries.length).toBeGreaterThan(50);
            expect(countries[0].code).toBe('BF');
        });

        it('chaque pays a un label, une value et un code', () => {
            const countries = getAllCountries();
            for (const c of countries.slice(0, 5)) {
                expect(c.label).toBeTruthy();
                expect(c.value).toBeTruthy();
                expect(c.code).toBeTruthy();
            }
        });
    });

    describe('getCitiesOfCountry', () => {
        // country-state-city est chargé en différé (import dynamique) pour ne pas
        // alourdir le chunk de la page qui l'utilise — on vérifie que ça reste asynchrone
        // et fonctionnel.
        it('retourne une Promise (chargement différé du module lourd)', () => {
            const result = getCitiesOfCountry('BF');
            expect(result instanceof Promise).toBeTrue();
        });

        it('résout avec une liste de villes triées pour un pays valide', async () => {
            const cities = await getCitiesOfCountry('BF');
            expect(cities.length).toBeGreaterThan(0);
            const sorted = [...cities].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
            expect(cities.map(c => c.label)).toEqual(sorted.map(c => c.label));
        });

        it('résout avec une liste vide pour un code pays inconnu', async () => {
            const cities = await getCitiesOfCountry('ZZ');
            expect(cities).toEqual([]);
        });
    });
});
