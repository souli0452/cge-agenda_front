import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-event-edit',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h5>Modifier l'événement</h5>
                    <p>Modification - En développement</p>
                </div>
            </div>
        </div>
    `
})
export class EventEditComponent {}