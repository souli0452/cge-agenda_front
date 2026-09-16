import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environments } from '../../environments/environments';

export interface PermissionCatalogEntry {
    cle: string;
    description: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {

    private readonly meUrl = `${environments.apiUrl}/me`;
    private readonly adminUrl = `${environments.apiUrl}/admin`;

    /** Permissions résolues de l'utilisateur courant, mises en cache après le premier appel. */
    private mesPermissions: Set<string> | null = null;

    constructor(private http: HttpClient) {}

    chargerMesPermissions(): Observable<Set<string>> {
        return this.http.get<string[]>(`${this.meUrl}/permissions`).pipe(
            tap(list => { this.mesPermissions = new Set(list); }),
            catchError(() => { this.mesPermissions = new Set(); return of(this.mesPermissions); })
        ) as unknown as Observable<Set<string>>;
    }

    has(permissionCle: string): boolean {
        return !!this.mesPermissions?.has(permissionCle);
    }

    getCatalogue(): Observable<PermissionCatalogEntry[]> {
        return this.http.get<PermissionCatalogEntry[]>(`${this.adminUrl}/permissions/catalogue`);
    }

    getMatrice(): Observable<{ [role: string]: string[] }> {
        return this.http.get<{ [role: string]: string[] }>(`${this.adminUrl}/permissions/roles`);
    }

    definirPermissionsDuRole(roleName: string, permissionCles: string[]): Observable<void> {
        return this.http.put<void>(`${this.adminUrl}/permissions/roles/${roleName}`, permissionCles);
    }
}
