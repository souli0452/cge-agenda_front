// ==========================================
// EVENT TYPE
// ==========================================
export enum EventType {
    REUNION    = 'REUNION',
    CONFERENCE = 'CONFERENCE',
    ATELIER    = 'ATELIER',
    SEMINAIRE  = 'SEMINAIRE',
    FORMATION  = 'FORMATION',
    MISSION    = 'MISSION',
    AUDIENCE   = 'AUDIENCE',
    AUTRE      = 'AUTRE'
}

export const EventTypeLabels: { [key: string]: string } = {
    'REUNION':    'Réunion',
    'CONFERENCE': 'Conférence',
    'ATELIER':    'Atelier',
    'SEMINAIRE':  'Séminaire',
    'FORMATION':  'Formation',
    'MISSION':    'Mission',
    'AUDIENCE':   'Audience',
    'AUTRE':      'Autre'
};

// ==========================================
// EVENT STATUS — complet avec workflow CGE
// ==========================================
export enum EventStatus {
    BROUILLON             = 'BROUILLON',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    A_CORRIGER            = 'A_CORRIGER',
    PLANIFIE              = 'PLANIFIE',
    EN_COURS              = 'EN_COURS',
    TERMINE               = 'TERMINE',
    ANNULER               = 'ANNULER',
    REPORTER              = 'REPORTER',
    REJETE                = 'REJETE'
}

export const EventStatusLabels: { [key: string]: string } = {
    'BROUILLON':             'Brouillon',
    'EN_ATTENTE_VALIDATION': 'En attente de validation',
    'A_CORRIGER':            'À corriger',
    'PLANIFIE':              'Planifié',
    'EN_COURS':              'En cours',
    'TERMINE':               'Terminé',
    'ANNULER':               'Annulé',
    'REPORTER':              'Reporté',
    'REJETE':                'Rejeté'
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

export type TagSeverity =
    'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export function getEventTypeSeverity(type: EventType | string): TagSeverity {
    const map: { [key: string]: TagSeverity } = {
        'REUNION':    'info',
        'CONFERENCE': 'danger',
        'ATELIER':    'secondary',
        'SEMINAIRE':  'warn',
        'FORMATION':  'success',
        'MISSION':    'contrast',
        'AUDIENCE':   'contrast',
        'AUTRE':      'secondary'
    };
    return map[type] || 'info';
}

export function getEventStatusSeverity(status: EventStatus | string): TagSeverity {
    const map: { [key: string]: TagSeverity } = {
        'BROUILLON':             'secondary',
        'EN_ATTENTE_VALIDATION': 'warn',
        'A_CORRIGER':            'danger',
        'PLANIFIE':              'info',
        'EN_COURS':              'warn',
        'TERMINE':               'success',
        'ANNULER':               'danger',
        'REPORTER':              'secondary',
        'REJETE':                'danger'
    };
    return map[status] || 'info';
}

// ==========================================
// DROPDOWN OPTIONS
// ==========================================
export const EVENT_TYPE_OPTIONS = [
    { label: 'Réunion',    value: EventType.REUNION    },
    { label: 'Conférence', value: EventType.CONFERENCE },
    { label: 'Atelier',    value: EventType.ATELIER    },
    { label: 'Séminaire',  value: EventType.SEMINAIRE  },
    { label: 'Formation',  value: EventType.FORMATION  },
    { label: 'Mission',    value: EventType.MISSION    },
    { label: 'Audience',   value: EventType.AUDIENCE   },
    { label: 'Autre',      value: EventType.AUTRE      }
];

export const EVENT_STATUS_OPTIONS = [
    { label: 'Brouillon',               value: EventStatus.BROUILLON             },
    { label: 'En attente de validation',value: EventStatus.EN_ATTENTE_VALIDATION },
    { label: 'À corriger',              value: EventStatus.A_CORRIGER            },
    { label: 'Planifié',                value: EventStatus.PLANIFIE              },
    { label: 'En cours',               value: EventStatus.EN_COURS              },
    { label: 'Terminé',                value: EventStatus.TERMINE               },
    { label: 'Annulé',                 value: EventStatus.ANNULER               },
    { label: 'Reporté',                value: EventStatus.REPORTER              },
    { label: 'Rejeté',                 value: EventStatus.REJETE                }
];

export const PARTICIPANT_TYPE_OPTIONS = [
    { label: 'Interne', value: ParticipantType.INTERNE },
    { label: 'Externe', value: ParticipantType.EXTERNE }
];

export function getParticipantTypeSeverity(
    type: ParticipantType | string
): TagSeverity {
    const map: { [key: string]: TagSeverity } = {
        'INTERNE': 'success',
        'EXTERNE': 'warn'
    };
    return map[type] || 'info';
}