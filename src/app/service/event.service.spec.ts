import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environments } from '../../environments/environments';
import { EventService } from './event.service';

describe('EventService', () => {
    let service: EventService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [EventService, provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(EventService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    describe('getEventsByDateRange', () => {
        it('appelle le vrai endpoint /period avec startDate et endDate', () => {
            service.getEventsByDateRange('2026-09-13', '2026-09-13').subscribe();

            const req = httpMock.expectOne(
                r => r.url === `${environments.apiUrl}/event/period`
            );
            expect(req.request.params.get('startDate')).toBe('2026-09-13');
            expect(req.request.params.get('endDate')).toBe('2026-09-13');
            req.flush([]);
        });
    });
});
