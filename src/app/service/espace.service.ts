import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface Espace {
    id: string;
    nom: string;
    chefEmail: string;
    chefNom?: string;
    createdAt?: string;
}

export interface MembreEspace {
    id: string;
    espaceId: string;
    membreEmail: string;
    membreNom?: string;
    role: 'SECRETAIRE' | 'PROTOCOLE';
    statut: 'INVITE' | 'ACTIF';
    invitedAt?: string;
    activatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EspaceService {

    private readonly adminUrl = `${environments.apiUrl}/admin/espaces`;
    private readonly url = `${environments.apiUrl}/espaces`;

    constructor(private http: HttpClient) {}

    // Admin : création/suppression des espaces
    getAllEspaces(): Observable<Espace[]> {
        return this.http.get<Espace[]>(this.adminUrl);
    }

    createEspace(nom: string, chefEmail: string, chefNom: string): Observable<Espace> {
        return this.http.post<Espace>(this.adminUrl, { nom, chefEmail, chefNom });
    }

    deleteEspace(id: string): Observable<void> {
        return this.http.delete<void>(`${this.adminUrl}/${id}`);
    }

    // Espaces accessibles à l'utilisateur courant (propriétaire + membre actif)
    mesEspaces(): Observable<Espace[]> {
        return this.http.get<Espace[]>(`${this.url}/mes-espaces`);
    }

    // Gestion des gestionnaires d'un espace (par son propriétaire)
    getMembres(espaceId: string): Observable<MembreEspace[]> {
        return this.http.get<MembreEspace[]>(`${this.url}/${espaceId}/membres`);
    }

    ajouterMembre(espaceId: string, membreEmail: string, membreNom: string, role: 'SECRETAIRE' | 'PROTOCOLE'): Observable<MembreEspace> {
        return this.http.post<MembreEspace>(`${this.url}/${espaceId}/membres`, { membreEmail, membreNom, role });
    }

    retirerMembre(espaceId: string, membreEspaceId: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${espaceId}/membres/${membreEspaceId}`);
    }
}
