import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Participant } from '../models';
import { environments } from '../../environments/environments';

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export function normalizePage<T>(raw: any): PageResponse<T> {
    if (raw?.page && typeof raw.page === 'object') {
        return {
            content:       raw.content       ?? [],
            totalElements: raw.page.totalElements ?? 0,
            totalPages:    raw.page.totalPages    ?? 0,
            size:          raw.page.size          ?? 20,
            number:        raw.page.number        ?? 0,
        };
    }
    return raw as PageResponse<T>;
}

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private baseUrl = `${environments.apiUrl}/participant`;

    constructor(private http: HttpClient) {}

    getAllParticipants(): Observable<Participant[]> {
        return this.http.get<Participant[]>(`${this.baseUrl}/all`);
    }

    getParticipantsPaged(
        page: number = 0,
        size: number = 20,
        sortBy: string = 'lastName',
        direction: string = 'asc',
        keyword?: string,
        type?: string
    ): Observable<PageResponse<Participant>> {
        let params = new HttpParams()
            .set('page', String(page))
            .set('size', String(size))
            .set('sortBy', sortBy)
            .set('direction', direction);
        if (keyword) params = params.set('keyword', keyword);
        if (type)    params = params.set('type', type);
        return this.http.get<any>(`${this.baseUrl}/paged`, { params }).pipe(map(normalizePage<Participant>));
    }

    autocompleteParticipants(q: string): Observable<Participant[]> {
        return this.http.get<any>(`${this.baseUrl}/autocomplete`, { params: { q } }).pipe(
            map(res => Array.isArray(res) ? res : (res?.content ?? []))
        );
    }

    searchParticipants(keyword: string, page: number = 0, size: number = 20, type?: string): Observable<PageResponse<Participant>> {
        let params = new HttpParams()
            .set('keyword', keyword)
            .set('page', String(page))
            .set('size', String(size));
        if (type) params = params.set('type', type);
        return this.http.get<any>(`${this.baseUrl}/search`, { params }).pipe(map(normalizePage<Participant>));
    }

    getParticipantById(id: string): Observable<Participant> {
        return this.http.get<Participant>(`${this.baseUrl}/${id}`);
    }

    createParticipant(participant: Participant): Observable<Participant> {
        return this.http.post<Participant>(`${this.baseUrl}/create`, participant);
    }

    updateParticipant(id: string, participant: Participant): Observable<Participant> {
        return this.http.put<Participant>(`${this.baseUrl}/update/${id}`, participant);
    }

    deleteParticipant(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
    }

    getCorbeille(): Observable<Participant[]> {
        return this.http.get<Participant[]>(`${this.baseUrl}/corbeille`);
    }

    restoreParticipant(id: string): Observable<Participant> {
        return this.http.put<Participant>(`${this.baseUrl}/${id}/restore`, {});
    }

    deleteParticipantPermanently(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}/permanent`);
    }
}
