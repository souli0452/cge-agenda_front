export interface RoleMeta {
    label:   string;
    color:   string;
    bgColor: string;
    icon:    string;
}

export const ROLE_META: Record<string, RoleMeta> = {
    ADMIN: {
        label:   'Administrateur',
        color:   '#DC2626',
        bgColor: '#FEF2F2',
        icon:    'pi-shield'
    },
    CGE: {
        label:   'CGE',
        color:   '#009640',
        bgColor: '#E5F4EC',
        icon:    'pi-star'
    },
    DIRECTEUR_CABINET: {
        label:   'Directeur de Cabinet',
        color:   '#7C3AED',
        bgColor: '#F5F3FF',
        icon:    'pi-briefcase'
    },
    PROTOCOLE: {
        label:   'Protocole',
        color:   '#D97706',
        bgColor: '#FEF3C7',
        icon:    'pi-tag'
    },
    SECRETAIRE: {
        label:   'Secrétaire',
        color:   '#2563EB',
        bgColor: '#EFF6FF',
        icon:    'pi-user'
    },
    DELEGUE: {
        label:   'Délégué',
        color:   '#0891B2',
        bgColor: '#ECFEFF',
        icon:    'pi-send'
    },
    USER: {
        label:   'Utilisateur',
        color:   '#607D8B',
        bgColor: '#F9FAFB',
        icon:    'pi-user'
    }
};

/**
 * Rôles internes crées automatiquement par Keycloak (jamais assignés
 * volontairement par un admin) : à exclure de tout ce qui est montré
 * à l'utilisateur (listes, stats, badges) - ce ne sont pas des rôles
 * métier. "default-roles-<realm>" est composite et regroupe les deux
 * autres pour chaque nouveau compte.
 */
export function isTechnicalRole(role: string): boolean {
    return role === 'offline_access' ||
           role === 'uma_authorization' ||
           role.startsWith('default-roles-');
}

export function getRoleLabel(role: string): string {
    return ROLE_META[role]?.label ?? role;
}
