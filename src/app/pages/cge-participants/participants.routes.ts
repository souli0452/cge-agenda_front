import { Routes } from '@angular/router';

export const PARTICIPANTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./participant-list').then(m => m.ParticipantListComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./participant-detail').then(m => m.ParticipantDetailComponent)
    }
];