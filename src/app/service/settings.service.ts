import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../environments/environments';

export interface UserSettings {
    id?:                     string;
    userId?:                 string;
    userEmail?:              string;
    emailInvitationEnabled:  boolean;
    emailValidationEnabled:  boolean;
    emailReminderEnabled:    boolean;
    updatedAt?:              string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {

    constructor(private http: HttpClient) {}

    getSettings(): Observable<UserSettings> {
        return this.http.get<UserSettings>(`${environments.apiUrl}/settings`);
    }

    updateSettings(settings: UserSettings): Observable<UserSettings> {
        return this.http.patch<UserSettings>(`${environments.apiUrl}/settings`, settings);
    }
}
