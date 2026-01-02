import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';  

@Injectable({
    providedIn: 'root'
})
export class FileService {
    private apiUrl = `${environments.apiUrl}/file`;

    constructor(private http: HttpClient) {}

    uploadFile(eventId: string, file: File, description: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('eventId', eventId);
        if (description) {
            formData.append('description', description);
        }
        return this.http.post(`${this.apiUrl}/upload`, formData);
    }

    downloadFile(fileId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${fileId}`, {
            responseType: 'blob'
        });
    }

    deleteFile(fileId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${fileId}`);
    }

    getFilesByEvent(eventId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/event/${eventId}`);
    }
}