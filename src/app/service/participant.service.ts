import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participant } from '../models';
import { environments } from '../../environments/environments';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private baseUrl = `${environments.apiUrl}/participant`;

    constructor(private http: HttpClient) {}

    getAllParticipants(): Observable<Participant[]> {
        return this.http.get<Participant[]>(`${this.baseUrl}/all`);
    }

    getParticipantById(id: string): Observable<Participant> {
        return this.http.get<Participant>(`${this.baseUrl}/${id}`);
    }

    searchParticipants(query: string): Observable<Participant[]> {
        return this.http.get<Participant[]>(`${this.baseUrl}/search`, {
            params: { query }
        });
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
}