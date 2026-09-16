import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environments } from '../../environments/environments';
import { PageResponse, normalizePage } from './participant.service';

export interface AuditLog {
    id:           string;
    timestamp:    string;
    action:       string;
    entityType:   string;
    entityId:     string;
    entityTitle:  string;
    userId:       string;
    userEmail:    string;
    userFullName: string;
    userRole:     string;
    ipAddress:    string;
    userAgent:    string;
    details:      string;
}

export interface ActiveUser {
    userEmail:    string;
    userFullName: string;
    userRole:     string;
    lastActivity: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {

    private baseUrl = `${environments.apiUrl}/audit`;

    constructor(private http: HttpClient) {}

    getPaged(
        page: number = 0,
        size: number = 20,
        action?: string,
        userEmail?: string,
        from?: string,
        to?: string
    ): Observable<PageResponse<AuditLog>> {
        let params = new HttpParams()
            .set('page', String(page))
            .set('size', String(size));
        if (action)    params = params.set('action', action);
        if (userEmail) params = params.set('userEmail', userEmail);
        if (from)      params = params.set('from', from);
        if (to)        params = params.set('to', to);
        return this.http.get<any>(`${this.baseUrl}/paged`, { params }).pipe(map(normalizePage<AuditLog>));
    }

    getRecentlyActiveUsers(): Observable<ActiveUser[]> {
        return this.http.get<ActiveUser[]>(`${this.baseUrl}/recently-active`);
    }
}
