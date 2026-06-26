import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface SchedulerConfig {
    reminderEnabled:  boolean;
    sendHour:         number;       
    reminderDays:     number[];     
    nextScheduledRun?: string;
    updatedAt?:       string;
    updatedBy?:       string;
}

@Injectable({ providedIn: 'root' })
export class SchedulerConfigService {

    private readonly url = `${environments.apiUrl}/admin/scheduler`;

    constructor(private http: HttpClient) {}

    getConfig(): Observable<SchedulerConfig> {
        return this.http.get<SchedulerConfig>(this.url);
    }

    updateConfig(config: SchedulerConfig): Observable<SchedulerConfig> {
        return this.http.put<SchedulerConfig>(this.url, config);
    }

    runNow(): Observable<{ status: string; message: string }> {
        return this.http.post<{ status: string; message: string }>(
            `${this.url}/run-now`, {}
        );
    }
}
