import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {
    EVENT_TYPE_OPTIONS,
    EVENT_STATUS_OPTIONS,
    EventType,
    EventStatus
} from '../../../../models';

export interface EventFilters {
    search:  string;
    type:    EventType  | null;
    status:  EventStatus | null;
}

@Component({
    selector: 'app-event-filters',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        IconFieldModule, InputIconModule, InputText,
        Select, ButtonModule, TooltipModule
    ],
    templateUrl: './event-filters.html',
    styleUrls:   ['./event-filters.css']
})
export class EventFiltersComponent {
    @Output() filtersChange = new EventEmitter<EventFilters>();

    typeOptions   = EVENT_TYPE_OPTIONS;
    statusOptions = EVENT_STATUS_OPTIONS;

    filters: EventFilters = { search: '', type: null, status: null };

    emit(): void { this.filtersChange.emit({ ...this.filters }); }

    reset(): void {
        this.filters = { search: '', type: null, status: null };
        this.emit();
    }
}
