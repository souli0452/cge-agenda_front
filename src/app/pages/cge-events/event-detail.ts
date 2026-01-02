import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-event-detail',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h5>Détails de l'événement</h5>
                    <p>Détails - En développement</p>
                </div>
            </div>
        </div>
    `
})
export class EventDetailComponent {}