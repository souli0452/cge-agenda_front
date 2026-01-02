import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-cge-documents',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="grid">
            <div class="col-12">
                <div class="card">
                    <h5>Documents</h5>
                    <p>Gestion des documents - En développement</p>
                </div>
            </div>
        </div>
    `
})
export class CgeDocumentsComponent {}