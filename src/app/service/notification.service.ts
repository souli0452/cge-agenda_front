import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface AppNotification {
    id: string;
    type: string;
    eventId?: string;
    message: string;
    lue: boolean;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environments.apiUrl}/notifications`;

    constructor(private http: HttpClient) {}

    getMesNotifications(): Observable<AppNotification[]> {
        return this.http.get<AppNotification[]>(this.apiUrl);
    }

    countNonLues(): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/count-non-lues`);
    }

    marquerLue(id: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/lue`, null);
    }

    marquerToutesLues(): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/marquer-toutes-lues`, null);
    }
}
