import * as i18nCountries from 'i18n-iso-countries';
import frLocale from 'i18n-iso-countries/langs/fr.json';

i18nCountries.registerLocale(frLocale);

export interface GeoCountry { label: string; value: string; code: string; flag?: string; }
export interface GeoCity    { label: string; value: string; }

// Pays prioritaires affichés en tête de liste
const PRIORITY_CODES = ['BF','SN','ML','NE','CI','TG','BJ','GN','CM','NG','MA','DZ','TN','EG','FR','BE','CA','US','GB','DE','CN'];

export function getAllCountries(): GeoCountry[] {
    const names = i18nCountries.getNames('fr', { select: 'official' });

    const all: GeoCountry[] = Object.entries(names).map(([code, label]) => ({
        code,
        label,
        value: label,
    }));

    return all.sort((a, b) => {
        const pa = PRIORITY_CODES.indexOf(a.code);
        const pb = PRIORITY_CODES.indexOf(b.code);
        if (pa !== -1 && pb !== -1) return pa - pb;
        if (pa !== -1) return -1;
        if (pb !== -1) return 1;
        return a.label.localeCompare(b.label, 'fr');
    });
}

/**
 * Chargée à la demande (import dynamique) : country-state-city embarque la base
 * mondiale des villes et alourdit sinon considérablement le chunk qui l'importe.
 */
export async function getCitiesOfCountry(countryCode: string): Promise<GeoCity[]> {
    const { City } = await import('country-state-city');
    const cities = City.getCitiesOfCountry(countryCode) ?? [];
    return cities
        .map(c => ({ label: c.name, value: c.name }))
        .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}
