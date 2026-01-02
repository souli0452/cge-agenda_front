import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-admin-users',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h5>Utilisateurs</h5>
                    <p>Gestion des utilisateurs - En développement</p>
                </div>
            </div>
        </div>
    `
})
export class AdminUsersComponent {}