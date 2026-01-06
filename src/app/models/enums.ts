// ==========================================
// EVENT TYPE
// ==========================================
export enum EventType {
    REUNION = 'REUNION',
    CONFERENCE = 'CONFERENCE',
    ATELIER = 'ATELIER',
    SEMINAIRE = 'SEMINAIRE',
    FORMATION = 'FORMATION',
    MISSION = 'MISSION',
    AUTRE = 'AUTRE'
}

export const EventTypeLabels: { [key: string]: string } = {
    'REUNION': 'Réunion',
    'CONFERENCE': 'Conférence',
    'ATELIER': 'Atelier',
    'SEMINAIRE': 'Séminaire',
    'FORMATION': 'Formation',
    'MISSION': 'Mission',
    'AUTRE': 'Autre'
};

// ==========================================
// EVENT STATUS
// ==========================================
export enum EventStatus {
    PLANIFIE = 'PLANIFIE',
    EN_COURS = 'EN_COURS',
    TERMINE = 'TERMINE',
    ANNULER = 'ANNULER',
    REPORTER = 'REPORTER'
}

export const EventStatusLabels: { [key: string]: string } = {
    'PLANIFIE': 'Planifié',
    'EN_COURS': 'En cours',
    'TERMINE': 'Terminé',
    'ANNULER': 'Annulé',
    'REPORTER': 'Reporté'
};

// ==========================================
// PARTICIPANT TYPE
// ==========================================
export enum ParticipantType {
    INTERNE = 'INTERNE',
    EXTERNE = 'EXTERNE'
}

export const ParticipantTypeLabels: { [key: string]: string } = {
    'INTERNE': 'Interne',
    'EXTERNE': 'Externe'
};


export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export function getEventTypeSeverity(type: EventType | string): TagSeverity {
    const map: { [key: string]: TagSeverity } = {
        'REUNION': 'info',
        'CONFERENCE': 'danger',
        'ATELIER': 'secondary',
        'SEMINAIRE': 'warn',
        'FORMATION': 'success',
        'MISSION': 'contrast',
        'AUTRE': 'secondary'
    };
    return map[type] || 'info';
}

export function getEventStatusSeverity(status: EventStatus | string): TagSeverity {
    const map: { [key: string]: TagSeverity } = {
        'PLANIFIE': 'info',
        'EN_COURS': 'warn',
        'TERMINE': 'success',
        'ANNULER': 'danger',
        'REPORTER': 'secondary'
    };
    return map[status] || 'info';
}

// ==========================================
// DROPDOWN OPTIONS
// ==========================================
export const EVENT_TYPE_OPTIONS = [
    { label: 'Réunion', value: EventType.REUNION },
    { label: 'Conférence', value: EventType.CONFERENCE },
    { label: 'Atelier', value: EventType.ATELIER },
    { label: 'Séminaire', value: EventType.SEMINAIRE },
    { label: 'Formation', value: EventType.FORMATION },
    { label: 'Mission', value: EventType.MISSION },
    { label: 'Autre', value: EventType.AUTRE }
];

export const EVENT_STATUS_OPTIONS = [
    { label: 'Planifié', value: EventStatus.PLANIFIE },
    { label: 'En cours', value: EventStatus.EN_COURS },
    { label: 'Terminé', value: EventStatus.TERMINE },
    { label: 'Annulé', value: EventStatus.ANNULER },
    { label: 'Reporté', value: EventStatus.REPORTER }
];

export const PARTICIPANT_TYPE_OPTIONS = [
    { label: 'Interne', value: ParticipantType.INTERNE },
    { label: 'Externe', value: ParticipantType.EXTERNE }
];