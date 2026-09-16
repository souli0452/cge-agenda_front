import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ViewMode = 'list' | 'card';

@Component({
    selector: 'app-view-mode-toggle',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './view-mode-toggle.html',
    styleUrl: './view-mode-toggle.css'
})
export class ViewModeToggleComponent {
    @Input() viewMode: ViewMode = 'list';
    @Output() viewModeChange = new EventEmitter<ViewMode>();

    setMode(mode: ViewMode): void {
        if (mode !== this.viewMode) {
            this.viewMode = mode;
            this.viewModeChange.emit(mode);
        }
    }
}
