import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Event } from '../../../../models';

@Component({
    selector: 'app-event-row-actions',
    standalone: true,
    imports: [CommonModule, ButtonModule, TooltipModule],
    templateUrl: './event-row-actions.html'
})
export class EventRowActionsComponent {
    @Input({ required: true }) event!: Event;
    @Input() canEdit     = false;
    @Input() canDelete   = false;
    @Input() canCancel   = false;
    @Input() canPostpone = false;

    @Output() view     = new EventEmitter<Event>();
    @Output() edit     = new EventEmitter<Event>();
    @Output() cancel   = new EventEmitter<Event>();
    @Output() postpone = new EventEmitter<Event>();
    @Output() delete   = new EventEmitter<Event>();
}
