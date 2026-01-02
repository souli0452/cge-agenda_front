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

    createEvent(event: Event): Observable<Event> {
        return this.http.post<Event>(`${this.apiUrl}/create`, event);
    }

    updateEvent(id: string, event: Event): Observable<Event> {
        return this.http.put<Event>(`${this.apiUrl}/update/${id}`, event);
    }

    deleteEvent(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    cancelEvent(id: string, reason: string): Observable<Event> {
        const params = new HttpParams().set('reason', reason);
        return this.http.patch<Event>(`${this.apiUrl}/cancel/${id}`, null, { params });
    }

    postponeEvent(id: string, newStartDate: string, newEndDate: string): Observable<Event> {
        const params = new HttpParams()
            .set('newStartDate', newStartDate)
            .set('newEndDate', newEndDate);
        return this.http.patch<Event>(`${this.apiUrl}/postpone/${id}`, null, { params });
    }

    searchEvents(filters: {
        keyword?: string;
        type?: EventType;
        status?: EventStatus;
        startDate?: string;
        endDate?: string;
    }): Observable<Event[]> {
        let params = new HttpParams();
        Object.keys(filters).forEach(key => {
            const value = (filters as any)[key];
            if (value) {
                params = params.set(key, value);
            }
        });
        return this.http.get<Event[]>(`${this.apiUrl}/search`, { params });
    }

    getEventsByMonth(year: number, month: number): Observable<Event[]> {
        return this.http.get<Event[]>(`${this.apiUrl}/calendar/${year}/${month}`);
    }

    addParticipant(eventId: string, participant: Participant): Observable<Event> {
        return this.http.post<Event>(`${this.apiUrl}/${eventId}/participants`, participant);
    }

    removeParticipant(eventId: string, participantId: string): Observable<Event> {
        return this.http.delete<Event>(`${this.apiUrl}/${eventId}/participants/${participantId}`);
    }

    getEventParticipants(eventId: string): Observable<Participant[]> {
        return this.http.get<Participant[]>(`${this.apiUrl}/${eventId}/participants`);
    }

    generateAttendanceSheet(eventId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/attendance-sheet/${eventId}`, {
            responseType: 'blob'
        });
    }
}