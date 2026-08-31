import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface BackupInfo {
    filename:      string;
    createdAt:     string;
    sizeBytes:     number;
    sizeFormatted: string;
    type:          'MANUAL' | 'AUTO';
    createdBy?:    string;
}

export interface BackupConfig {
    autoEnabled:    boolean;
    backupHour:     number;
    backupMinute:   number;
    retentionCount: number;
}

@Injectable({ providedIn: 'root' })
export class BackupService {
    private http = inject(HttpClient);
    private base = `${environments.apiUrl}/admin/backup`;

    list(): Observable<BackupInfo[]> {
        return this.http.get<BackupInfo[]>(this.base);
    }

    create(): Observable<BackupInfo> {
        return this.http.post<BackupInfo>(this.base, {});
    }

    restore(filename: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.base}/restore/${encodeURIComponent(filename)}`, {}
        );
    }

    delete(filename: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/${encodeURIComponent(filename)}`);
    }

    download(filename: string): Observable<Blob> {
        return this.http.get(
            `${this.base}/download/${encodeURIComponent(filename)}`,
            { responseType: 'blob' }
        );
    }

    getConfig(): Observable<BackupConfig> {
        return this.http.get<BackupConfig>(`${this.base}/config`);
    }

    saveConfig(cfg: BackupConfig): Observable<BackupConfig> {
        return this.http.put<BackupConfig>(`${this.base}/config`, cfg);
    }


    listCorbeille(): Observable<BackupInfo[]> {
        return this.http.get<BackupInfo[]>(`${this.base}/corbeille`);
    }

    restoreFromCorbeille(filename: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.base}/corbeille/${encodeURIComponent(filename)}/restore`, {}
        );
    }

    deletePermanently(filename: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/corbeille/${encodeURIComponent(filename)}`);
    }
}
