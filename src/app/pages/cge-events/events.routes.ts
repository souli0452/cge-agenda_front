import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../guards/unsaved-changes.guard';

export const EVENTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./event-list').then(m => m.EventListComponent)
    },
    {
        path: 'create',
        loadComponent: () => import('./event-create').then(m => m.EventCreateComponent),
        canDeactivate: [unsavedChangesGuard]
    },
    {
        path: ':id',
        loadComponent: () => import('./event-detail').then(m => m.EventDetailComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./event-edit').then(m => m.EventEditComponent),
        canDeactivate: [unsavedChangesGuard]
    }
];