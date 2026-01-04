import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';
import { DashboardStats, MonthlyReport } from '../models';

@Injectable({
    providedIn: 'root'
})
export class StatsService {
    private apiUrl = `${environments.apiUrl}/stats`;

    constructor(private http: HttpClient) {}

    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
    }

    getMonthlyReport(year: number, month: number): Observable<MonthlyReport> {
        return this.http.get<MonthlyReport>(`${this.apiUrl}/monthly/${year}/${month}`);
    }
    getEventsByStatusAndMonth(year: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/events-by-status-and-month/${year}`);
}
}