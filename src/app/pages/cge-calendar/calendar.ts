import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-cge-calendar',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h5>Calendrier</h5>
                    <p>Vue calendrier des événements - En cours de développement</p>
                </div>
            </div>
        </div>
    `
})
export class CgeCalendarComponent {}