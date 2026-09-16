import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface EventTypeSla {
    eventType: string;
    delaiHeuresOuvrables: number;
    delaiAvantEvenementHeures: number;
}

@Injectable({ providedIn: 'root' })
export class SlaConfigService {

    private readonly url = `${environments.apiUrl}/admin/sla`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<EventTypeSla[]> {
        return this.http.get<EventTypeSla[]>(this.url);
    }

    update(eventType: string, sla: EventTypeSla): Observable<EventTypeSla> {
        return this.http.put<EventTypeSla>(`${this.url}/${eventType}`, sla);
    }
}
