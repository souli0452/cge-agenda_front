import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { EspaceService } from '../../service/espace.service';

/**
 * "Mon équipe" dans le menu n'a pas d'ID d'espace statique : ce composant résout
 * l'espace dont l'utilisateur courant est propriétaire (chef) puis redirige vers
 * l'écran de gestion d'équipe de cet espace.
 */
@Component({
    selector: 'app-mon-equipe-redirect',
    standalone: true,
    imports: [CommonModule],
    template: `
<div style="display:flex;align-items:center;justify-content:center;min-height:300px;flex-direction:column;gap:12px;">
    <i class="pi pi-spin pi-spinner" style="font-size:2rem;color:var(--cge-vert-moyen,#009640)"></i>
    <p *ngIf="erreur" style="color:var(--text-color-secondary)">
        Vous n'êtes propriétaire d'aucun espace agenda. Contactez un administrateur.
    </p>
</div>
    `
})
export class MonEquipeRedirectComponent implements OnInit {

    erreur = false;

    constructor(
        private espaceService: EspaceService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.espaceService.mesEspaces().subscribe({
            next: (espaces) => {
                const monEmail = (this.authService.email || '').toLowerCase();
                const monEspace = espaces.find(e => (e.chefEmail || '').toLowerCase() === monEmail) || espaces[0];
                if (monEspace) {
                    this.router.navigate(['/espaces', monEspace.id, 'equipe']);
                } else {
                    this.erreur = true;
                }
            },
            error: () => { this.erreur = true; }
        });
    }
}
