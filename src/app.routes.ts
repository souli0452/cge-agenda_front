import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';
import { AuthGuard } from '@/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./app/pages/cge-dashboard/dashboard')
                        .then(m => m.CgeDashboardComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE', 'USER'] }
            },
            {
                path: 'validation',
                loadComponent: () =>
                    import('./app/pages/cge-dashboard/validation-dashboard')
                        .then(m => m.ValidationDashboardComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE'] }
            },
            {
                path: 'events',
                loadChildren: () =>
                    import('./app/pages/cge-events/events.routes')
                        .then(m => m.EVENTS_ROUTES),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE', 'USER'] }
            },
            {
                path: 'calendar',
                loadComponent: () =>
                    import('./app/pages/cge-calendar/calendar')
                        .then(m => m.CgeCalendarComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE', 'USER'] }
            },
            {
                path: 'participants',
                loadChildren: () =>
                    import('./app/pages/cge-participants/participants.routes')
                        .then(m => m.PARTICIPANTS_ROUTES),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE'] }
            },
            {
                path: 'statistics',
                loadComponent: () =>
                    import('./app/pages/cge-statistics/statistics')
                        .then(m => m.CgeStatisticsComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET'] }
            },
            {
                path: 'corbeille',
                loadComponent: () =>
                    import('./app/pages/cge-events/corbeille')
                        .then(m => m.CorbeilleComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE'] }
            },
            {
                path: 'admin/users',
                loadComponent: () =>
                    import('./app/pages/admin/users/users')
                        .then(m => m.AdminUsersComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN'] }
            },
            {
                path: 'admin/audit',
                loadComponent: () =>
                    import('./app/pages/admin/audit/audit-log')
                        .then(m => m.AuditLogComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN'] }
            },
            {
                path: 'admin/config',
                loadComponent: () =>
                    import('./app/pages/admin/config/org-config')
                        .then(m => m.OrgConfigComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN'] }
            },
            {
                path: 'admin/backup',
                loadComponent: () =>
                    import('./app/pages/admin/backup/backup')
                        .then(m => m.BackupComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN'] }
            },
            {
                path: 'profile',
                loadComponent: () =>
                    import('./app/pages/profile/profile')
                        .then(m => m.ProfileComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE', 'USER'] }
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('./app/pages/settings/settings')
                        .then(m => m.SettingsComponent),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE', 'USER'] }
            },
            {
                path: 'pages',
                loadChildren: () => import('./app/pages/pages.routes'),
                canActivate: [AuthGuard],
                data: { roles: ['ADMIN', 'CGE', 'DIRECTEUR_CABINET',
                                'PROTOCOLE', 'SECRETAIRE', 'USER'] }
            }
        ]
    },
    {
        path: 'notfound',
        component: Notfound
    },
    {
        path: 'auth',
        loadChildren: () => import('./app/pages/auth/auth.routes')
    },
    {
        path: '**',
        redirectTo: 'notfound'
    }
];