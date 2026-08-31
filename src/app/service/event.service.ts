import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';
import { Event, Participant } from '../models';
import { EventType, EventStatus } from '../models';

@Injectable({
    providedIn: 'root'
})
export class EventService {
    private apiUrl = `${environments.apiUrl}/event`;

    constructor(private http: HttpClient) {}

    getAllEvents(): Observable<Event[]> {
        return this.http.get<Event[]>(`${this.apiUrl}/all`);
    }

    getEventById(id: string): Observable<Event> {
        return this.http.get<Event>(`${this.apiUrl}/get/${id}`);
    }

    createEvent(event: Partial<Event>): Observable<Event> {
        return this.http.post<Event>(`${this.apiUrl}/create`, event);
    }

    updateEvent(id: string, event: Partial<Event>): Observable<Event> {
        return this.http.put<Event>(`${this.apiUrl}/update/${id}`, event);
    }

    updateStatusOnly(id: string, status: string): Observable<void> {
        return this.http.patch<void>(
            `${this.apiUrl}/status/${id}?status=${status}`,
            null
        );
    }

    deleteEvent(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    getCorbeille(): Observable<Event[]> {
        return this.http.get<Event[]>(`${this.apiUrl}/corbeille`);
    }

    restoreEvent(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/restaurer`, null);
    }

    deleteEventPermanently(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}/supprimer-definitivement`);
    }

    cancelEvent(id: string, reason: string): Observable<Event> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<Event>(
            `${this.apiUrl}/cancel/${id}`, null, { params }
        );
    }

    postponeEvent(id: string, newStartDate: string,
                  newEndDate: string): Observable<Event> {
        const params = new HttpParams()
            .set('newStartDate', newStartDate)
            .set('newEndDate',   newEndDate);
        return this.http.patch<Event>(
            `${this.apiUrl}/postpone/${id}`, null, { params }
        );
    }

    validateEvent(id: string, comment: string): Observable<Event> {
        const params = new HttpParams().set('comment', comment || '');
        return this.http.patch<Event>(
            `${this.apiUrl}/validate/${id}`, null, { params }
        );
    }

    rejectEvent(id: string, reason: string): Observable<Event> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<Event>(
            `${this.apiUrl}/reject/${id}`, null, { params }
        );
    }

    requestChanges(id: string, suggestions: string): Observable<Event> {
        const params = new HttpParams().set('suggestions', suggestions);
        return this.http.patch<Event>(
            `${this.apiUrl}/request-changes/${id}`, null, { params }
        );
    }

    delegateParticipation(id: string, nom: string,
                          email: string, motif: string): Observable<Event> {
        let params = new HttpParams()
            .set('delegueNom',   nom)
            .set('delegueEmail', email);
        if (motif) params = params.set('delegueMotif', motif);
        return this.http.patch<Event>(
            `${this.apiUrl}/delegate/${id}`, null, { params }
        );
    }

    submitDraft(id: string): Observable<Event> {
        return this.http.patch<Event>(`${this.apiUrl}/submit/${id}`, null);
    }

    dupliquerEnBrouillon(id: string): Observable<Event> {
        return this.http.post<Event>(`${this.apiUrl}/${id}/dupliquer`, null);
    }

    addObservation(id: string, observation: string): Observable<Event> {
        const params = new HttpParams().set('observation', observation);
        return this.http.patch<Event>(
            `${this.apiUrl}/${id}/observation`, null, { params }
        );
    }

    demanderDelegation(id: string, motif: string): Observable<Event> {
        const params = new HttpParams().set('motif', motif);
        return this.http.patch<Event>(
            `${this.apiUrl}/${id}/demander-delegation`, null, { params }
        );
    }

    saveCompteRendu(id: string, points: string, decisions: string, actions: string): Observable<Event> {
        const params = new HttpParams()
            .set('points', points)
            .set('decisions', decisions)
            .set('actions', actions);
        return this.http.put<Event>(
            `${this.apiUrl}/${id}/compte-rendu`, null, { params }
        );
    }

    downloadCompteRendu(id: string): Observable<Blob> {
        return this.http.get(
            `${this.apiUrl}/compte-rendu/${id}`,
            { responseType: 'blob' }
        );
    }

    searchEvents(filters: {
        keyword?:   string;
        type?:      EventType;
        status?:    EventStatus;
        startDate?: string;
        endDate?:   string;
    }): Observable<Event[]> {
        let params = new HttpParams();
        (Object.keys(filters) as (keyof typeof filters)[]).forEach(key => {
            const value = filters[key];
            if (value) params = params.set(key, value);
        });
        return this.http.get<Event[]>(`${this.apiUrl}/search`, { params });
    }

    getEventsByMonth(year: number, month: number): Observable<Event[]> {
        return this.http.get<Event[]>(
            `${this.apiUrl}/calendar/${year}/${month}`
        );
    }

    getEventsByDateRange(start: string, end: string): Observable<Event[]> {
        const params = new HttpParams()
            .set('start', start)
            .set('end',   end);
        return this.http.get<Event[]>(
            `${this.apiUrl}/range`, { params }
        );
    }

    addParticipant(eventId: string,
                   participant: Participant): Observable<Event> {
        return this.http.post<Event>(
            `${this.apiUrl}/${eventId}/participants`, participant
        );
    }

    removeParticipant(eventId: string,
                      participantId: string): Observable<Event> {
        return this.http.delete<Event>(
            `${this.apiUrl}/${eventId}/participants/${participantId}`
        );
    }

    getEventParticipants(eventId: string): Observable<Participant[]> {
        return this.http.get<Participant[]>(
            `${this.apiUrl}/${eventId}/participants`
        );
    }

    generateAttendanceSheet(eventId: string): Observable<Blob> {
        return this.http.get(
            `${this.apiUrl}/attendance-sheet/${eventId}`,
            { responseType: 'blob' }
        );
    }

    exportIcs(eventId: string): Observable<Blob> {
        return this.http.get(
            `${this.apiUrl}/ical/${eventId}`,
            { responseType: 'blob' }
        );
    }

    exportMonthlyPdf(
        year:     number,
        month:    number,
        keyword?: string,
        type?:    EventType,
        status?:  EventStatus
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('year',  year.toString())
            .set('month', month.toString());
        if (keyword) params = params.set('keyword', keyword);
        if (type)    params = params.set('type',    type);
        if (status)  params = params.set('status',  status);
        return this.http.get(
            `${environments.apiUrl}/events/export/monthly`,
            { params, responseType: 'blob' }
        );
    }

    getApiUrl(): string {
        return environments.apiUrl;
    }

    getEventsByParticipant(participantId: string): Observable<Event[]> {
        return this.http.get<Event[]>(
            `${this.apiUrl}/participants/${participantId}/events`
        );
    }
}