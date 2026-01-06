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
                redirectTo: '/dashboard',
                pathMatch: 'full'
            },
            // ==========================================
            // CGE AGENDA ROUTES
            // ==========================================
            {
                path: 'dashboard',
                loadComponent: () => 
                    import('./app/pages/cge-dashboard/dashboard').then(m => m.CgeDashboardComponent),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            },
            {
                path: 'events',
                loadChildren: () => 
                    import('./app/pages/cge-events/events.routes').then(m => m.EVENTS_ROUTES),
                canActivate: [AuthGuard],
                data: { roles: ['USER'] } // Seuls ceux avec le rôle USER (ou ADMIN si configuré ainsi)
            },
            {
                path: 'calendar',
                loadComponent: () => 
                    import('./app/pages/cge-calendar/calendar').then(m => m.CgeCalendarComponent),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            },
            {
                path: 'participants',
                loadChildren: () => 
                    import('./app/pages/cge-participants/participants.routes').then(m => m.PARTICIPANTS_ROUTES),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            },
            {
                path: 'documents',
                loadComponent: () => 
                    import('./app/pages/cge-documents/documents').then(m => m.CgeDocumentsComponent),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            },
            {
                path: 'statistics',
                loadComponent: () => 
                    import('./app/pages/cge-statistics/statistics').then(m => m.CgeStatisticsComponent),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            },
            {
                path: 'admin/users',
                loadComponent: () => 
                    import('./app/pages/admin/users/users').then(m => m.AdminUsersComponent),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            },
            {
                path: 'settings',
                loadComponent: () => 
                    import('./app/pages/settings/settings').then(m => m.SettingsComponent),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            },
            
            { 
                path: 'pages', 
                loadChildren: () => import('./app/pages/pages.routes'),
                canActivate : [AuthGuard],
                data : { roles : ['USER', 'ADMIN']}
            }
        ]
    },
    { 
        path: 'notfound', 
        component: Notfound 
    },
    { 
        path: 'auth', 
        loadChildren: () => import('./app/pages/auth/auth.routes'),
        canActivate : [AuthGuard],
        data : { roles : ['USER', 'ADMIN']}
    },
    { 
        path: '**', 
        redirectTo: '/notfound' 
    }
];