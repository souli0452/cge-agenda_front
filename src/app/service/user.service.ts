import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface KeycloakUser {
    id:               string | undefined;
    username:         string;
    email:            string;
    firstName:        string;
    lastName:         string;
    enabled:          boolean;
    emailVerified:    boolean;
    createdTimestamp: number;
    realmRoles?:      string[];
}

export interface KcRole {
    id:           string;
    name:         string;
    description?: string;
}

export interface UserPayload {
    username:  string;
    email:     string;
    firstName: string;
    lastName:  string;
    role:      string;
    enabled:   boolean;
    password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

    private baseUrl = `${environments.apiUrl}/admin`;

    constructor(private http: HttpClient) {}

    getUsers(): Observable<KeycloakUser[]> {
        return this.http.get<KeycloakUser[]>(`${this.baseUrl}/users`);
    }

    getRoles(): Observable<KcRole[]> {
        return this.http.get<KcRole[]>(`${this.baseUrl}/roles`);
    }

    createUser(payload: UserPayload): Observable<KeycloakUser> {
        return this.http.post<KeycloakUser>(`${this.baseUrl}/users`, payload);
    }

    updateUser(id: string, payload: UserPayload): Observable<KeycloakUser> {
        return this.http.put<KeycloakUser>(`${this.baseUrl}/users/${id}`, payload);
    }

    setUserStatus(id: string, enabled: boolean): Observable<void> {
        return this.http.patch<void>(`${this.baseUrl}/users/${id}/status`, { enabled });
    }

    resetPassword(id: string): Observable<{ temporaryPassword: string }> {
        return this.http.patch<{ temporaryPassword: string }>(`${this.baseUrl}/users/${id}/reset-password`, {});
    }

    deleteUser(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
    }

    createRole(name: string, description: string): Observable<KcRole> {
        return this.http.post<KcRole>(`${this.baseUrl}/roles`, { name, description });
    }

    deleteRole(roleName: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/roles/${roleName}`);
    }

    getUserRoles(userId: string): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/users/${userId}/roles`);
    }

    assignRole(userId: string, roleName: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/users/${userId}/roles/${roleName}`, {});
    }

    removeRole(userId: string, roleName: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/users/${userId}/roles/${roleName}`);
    }
}
