import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-participant-list',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h5>Liste des Participants</h5>
                    <p>Gestion des participants - En cours de développement</p>
                </div>
            </div>
        </div>
    `
})
export class ParticipantListComponent {}