import { Component, inject, isDevMode } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { PrimeNG } from 'primeng/config';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
    constructor() {
        const config = inject(PrimeNG);
        config.setTranslation({
            accept: 'Oui',
            reject: 'Non',
            choose: 'Choisir',
            cancel: 'Annuler',
            dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
            dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            dayNamesMin: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
            monthNamesShort: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                              'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            today: "Aujourd'hui",
            clear: 'Effacer',
            weekHeader: 'Sem',
            firstDayOfWeek: 1
        });

        if (!isDevMode()) {
            const swUpdate = inject(SwUpdate);
            if (swUpdate.isEnabled) {
                swUpdate.versionUpdates
                    .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
                    .subscribe(() => swUpdate.activateUpdate().then(() => window.location.reload()));
            }
        }
    }
}
