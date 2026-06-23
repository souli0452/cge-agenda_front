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
        color:   '#0B5C2E',
        bgColor: '#E8F4EC',
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
        color:   '#6B7280',
        bgColor: '#F9FAFB',
        icon:    'pi-user'
    }
};

export function getRoleLabel(role: string): string {
    return ROLE_META[role]?.label ?? role;
}
