import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface JourFerie {
    id?: string;
    date: string;
    libelle?: string;
}

@Injectable({ providedIn: 'root' })
export class JourFerieService {

    private readonly url = `${environments.apiUrl}/admin/jours-feries`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<JourFerie[]> {
        return this.http.get<JourFerie[]>(this.url);
    }

    create(jourFerie: JourFerie): Observable<JourFerie> {
        return this.http.post<JourFerie>(this.url, jourFerie);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
