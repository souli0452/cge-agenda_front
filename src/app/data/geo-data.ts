export interface GeoCountry { label: string; value: string; code: string; }
export interface GeoCity    { label: string; value: string; }

export const GEO_COUNTRIES: GeoCountry[] = [
    { label: 'Burkina Faso',          value: 'Burkina Faso',          code: 'BF' },
    { label: 'Bénin',                 value: 'Bénin',                 code: 'BJ' },
    { label: 'Côte d\'Ivoire',        value: 'Côte d\'Ivoire',        code: 'CI' },
    { label: 'Ghana',                 value: 'Ghana',                 code: 'GH' },
    { label: 'Mali',                  value: 'Mali',                  code: 'ML' },
    { label: 'Niger',                 value: 'Niger',                 code: 'NE' },
    { label: 'Togo',                  value: 'Togo',                  code: 'TG' },
    { label: 'Sénégal',               value: 'Sénégal',               code: 'SN' },
    { label: 'Guinée',                value: 'Guinée',                code: 'GN' },
    { label: 'Cameroun',              value: 'Cameroun',              code: 'CM' },
    { label: 'France',                value: 'France',                code: 'FR' },
    { label: 'Maroc',                 value: 'Maroc',                 code: 'MA' },
    { label: 'Algérie',               value: 'Algérie',               code: 'DZ' },
    { label: 'Tunisie',               value: 'Tunisie',               code: 'TN' },
    { label: 'Sénégal',               value: 'Sénégal',               code: 'SN' },
    { label: 'Congo (RDC)',           value: 'Congo (RDC)',           code: 'CD' },
    { label: 'Congo (Brazzaville)',   value: 'Congo (Brazzaville)',   code: 'CG' },
    { label: 'Gabon',                 value: 'Gabon',                 code: 'GA' },
    { label: 'Mauritanie',            value: 'Mauritanie',            code: 'MR' },
    { label: 'Tchad',                 value: 'Tchad',                 code: 'TD' },
    { label: 'Nigeria',               value: 'Nigeria',               code: 'NG' },
    { label: 'Liberia',               value: 'Liberia',               code: 'LR' },
    { label: 'Sierra Leone',          value: 'Sierra Leone',          code: 'SL' },
    { label: 'Guinée-Bissau',         value: 'Guinée-Bissau',         code: 'GW' },
    { label: 'Guinée équatoriale',    value: 'Guinée équatoriale',    code: 'GQ' },
    { label: 'États-Unis',            value: 'États-Unis',            code: 'US' },
    { label: 'Belgique',              value: 'Belgique',              code: 'BE' },
    { label: 'Suisse',                value: 'Suisse',                code: 'CH' },
    { label: 'Canada',                value: 'Canada',                code: 'CA' },
    { label: 'Autre',                 value: 'Autre',                 code: 'XX' },
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
    BF: [
        'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya',
        'Pouytenga', 'Kaya', 'Tenkodogo', 'Fada N\'Gourma', 'Dédougou',
        'Manga', 'Gaoua', 'Ziniaré', 'Dori', 'Kongoussi', 'Nouna',
        'Diapaga', 'Titao', 'Réo', 'Kombissiri', 'Léo', 'Boromo',
        'Tougan', 'Yako', 'Ziniare', 'Sapouy', 'Pô', 'Boulsa',
        'Bogandé', 'Djibo', 'Gorom-Gorom', 'Sebba', 'Solenzo',
    ],
    BJ: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou', 'Bohicon'],
    CI: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Korhogo', 'Man', 'San-Pédro'],
    GH: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Bolgatanga'],
    ML: ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Kayes', 'Gao', 'Tombouctou'],
    NE: ['Niamey', 'Zinder', 'Maradi', 'Tahoua', 'Agadez', 'Dosso'],
    TG: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Dapaong'],
    SN: ['Dakar', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor', 'Touba'],
    GN: ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé'],
    CM: ['Yaoundé', 'Douala', 'Garoua', 'Bafoussam', 'Bamenda'],
    FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Strasbourg'],
    MA: ['Rabat', 'Casablanca', 'Fès', 'Marrakech', 'Tanger', 'Agadir'],
};

export function getCitiesOfCountry(countryCode: string): GeoCity[] {
    const cities = CITIES_BY_COUNTRY[countryCode] ?? [];
    return cities
        .sort((a, b) => a.localeCompare(b))
        .map(c => ({ label: c, value: c }));
}

export function getAllCountries(): GeoCountry[] {
    const seen = new Set<string>();
    return GEO_COUNTRIES.filter(c => {
        if (seen.has(c.code)) return false;
        seen.add(c.code);
        return true;
    });
}
