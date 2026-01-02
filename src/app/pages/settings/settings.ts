import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h5>Paramètres</h5>
                    <p>Paramètres - En développement</p>
                </div>
            </div>
        </div>
    `
})
export class SettingsComponent {}

