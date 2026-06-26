import { Component, inject, isDevMode } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
    constructor() {
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
