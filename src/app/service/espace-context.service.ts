import { Injectable, signal } from '@angular/core';
import { EspaceService, Espace } from './espace.service';

/**
 * Espace actif choisi par l'utilisateur dans le sélecteur de la topbar, pour les
 * utilisateurs membres de plusieurs espaces (ex. secrétaire de deux chefs). Filtre
 * client-side les listes/calendrier ; null = "tous mes espaces" (comportement par défaut).
 */
@Injectable({ providedIn: 'root' })
export class EspaceContextService {

    private readonly STORAGE_KEY = 'cge_agenda_espace_actif';

    private readonly _mesEspaces  = signal<Espace[]>([]);
    private readonly _espaceActif = signal<string | null>(this.loadFromStorage());

    readonly mesEspaces  = this._mesEspaces.asReadonly();
    readonly espaceActif = this._espaceActif.asReadonly();

    constructor(private espaceService: EspaceService) {}

    charger(): void {
        this.espaceService.mesEspaces().subscribe({
            next: (espaces) => {
                this._mesEspaces.set(espaces);
                const actuel = this._espaceActif();
                if (actuel && !espaces.some(e => e.id === actuel)) {
                    this.setEspaceActif(null);
                }
            },
            error: () => {}
        });
    }

    setEspaceActif(espaceId: string | null): void {
        this._espaceActif.set(espaceId);
        if (espaceId) {
            localStorage.setItem(this.STORAGE_KEY, espaceId);
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    private loadFromStorage(): string | null {
        return localStorage.getItem(this.STORAGE_KEY);
    }
}
