import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            {
                path: '',
                redirectTo: '/dashboard',
                pathMatch: 'full'
            },
            // ==========================================
            // CGE AGENDA ROUTES
            // ==========================================
            {
                path: 'dashboard',
                loadComponent: () => 
                    import('./app/pages/cge-dashboard/dashboard').then(m => m.CgeDashboardComponent)
            },
            {
                path: 'events',
                loadChildren: () => 
                    import('./app/pages/cge-events/events.routes').then(m => m.EVENTS_ROUTES)
            },
            {
                path: 'calendar',
                loadComponent: () => 
                    import('./app/pages/cge-calendar/calendar').then(m => m.CgeCalendarComponent)
            },
            {
                path: 'participants',
                loadChildren: () => 
                    import('./app/pages/cge-participants/participants.routes').then(m => m.PARTICIPANTS_ROUTES)
            },
            {
                path: 'statistics',
                loadComponent: () => 
                    import('./app/pages/cge-statistics/statistics').then(m => m.CgeStatisticsComponent)
            },
            {
                path: 'admin/users',
                loadComponent: () => 
                    import('./app/pages/admin/users/users').then(m => m.AdminUsersComponent)
            },
            {
                path: 'settings',
                loadComponent: () => 
                    import('./app/pages/settings/settings').then(m => m.SettingsComponent)
            },
            
            { 
                path: 'pages', 
                loadChildren: () => import('./app/pages/pages.routes') 
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
        redirectTo: '/notfound' 
    }
];