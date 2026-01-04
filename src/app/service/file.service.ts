import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileUpload } from '../models';

@Injectable({
    providedIn: 'root'
})
export class FileService {
    private apiUrl = 'http://localhost:8081/api/v1/cge-agenda/file';

    constructor(private http: HttpClient) {}

    /**
     * Récupère tous les fichiers d'un événement
     */
    getFilesByEvent(eventId: string): Observable<FileUpload[]> {
        return this.http.get<FileUpload[]>(`${this.apiUrl}/event/${eventId}`);
    }

    /**
     * Upload un fichier
     * @param formData - FormData contenant 'file' et 'eventId'
     */
    uploadFile(formData: FormData): Observable<FileUpload> {
        return this.http.post<FileUpload>(`${this.apiUrl}/upload`, formData);
    }

    /**
     * Télécharge un fichier par son ID
     */
    downloadFile(fileId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download/${fileId}`, {
            responseType: 'blob'
        });
    }

    /**
     * Supprime un fichier par son ID
     */
    deleteFile(fileId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${fileId}`);
    }
}