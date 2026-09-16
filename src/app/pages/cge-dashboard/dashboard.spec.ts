import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environments } from '../../../environments/environments';
import { CgeDashboardComponent } from './dashboard';
import { Event } from '../../models';

describe('CgeDashboardComponent', () => {
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [CgeDashboardComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: Router, useValue: { navigate: () => {} } }
            ]
        });
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    function todayIso(): string {
        return new Date().toISOString().slice(0, 10);
    }

    function flushBoilerplateRequests(): void {
        // L'effect() du constructeur ré-exécute loadData()/loadEventsByStatusMonth() une fois
        // le composant initialisé (en plus de l'appel direct dans ngOnInit) : ces deux requêtes
        // peuvent donc arriver en double, sans rapport avec le comportement testé ici.
        httpMock.match(`${environments.apiUrl}/event/all`).forEach(req => req.flush([]));
        httpMock.match(
            r => r.url === `${environments.apiUrl}/stats/events-by-status-and-month/${new Date().getFullYear()}`
        ).forEach(req => req.flush({ PLANIFIE: { Jan: 0 } }));
    }

    it('charge les événements du jour au démarrage (startDate = endDate = aujourd\'hui)', () => {
        const fixture = TestBed.createComponent(CgeDashboardComponent);
        fixture.detectChanges();
        flushBoilerplateRequests();

        const req = httpMock.expectOne(
            r => r.url === `${environments.apiUrl}/event/period`
        );
        expect(req.request.params.get('startDate')).toBe(todayIso());
        expect(req.request.params.get('endDate')).toBe(todayIso());
        req.flush([]);
    });

    it('expose les événements du jour retournés par le backend', () => {
        const fixture = TestBed.createComponent(CgeDashboardComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        flushBoilerplateRequests();

        const todayEvent: Event = {
            title: 'Réunion budget', startDate: todayIso(), endDate: todayIso(),
            status: 'PLANIFIE' as any, type: 'REUNION' as any
        };
        httpMock.expectOne(r => r.url === `${environments.apiUrl}/event/period`).flush([todayEvent]);

        expect(component.todayEvents.length).toBe(1);
        expect(component.todayEvents[0].title).toBe('Réunion budget');
    });
});
