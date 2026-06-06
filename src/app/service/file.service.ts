import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileUpload } from '../models';
import { environments } from '../../environments/environments';

@Injectable({
    providedIn: 'root'
})
export class FileService {
    private apiUrl = `${environments.apiUrl}/file`;

    constructor(private http: HttpClient) {}

    getFilesByEvent(eventId: string): Observable<FileUpload[]> {
        return this.http.get<FileUpload[]>(`${this.apiUrl}/event/${eventId}`);
    }

    uploadFile(formData: FormData): Observable<FileUpload> {
        return this.http.post<FileUpload>(`${this.apiUrl}/upload`, formData);
    }

    downloadFile(fileId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${fileId}`, {
            responseType: 'blob'
        });
    }

    deleteFile(fileId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${fileId}`);
    }
}