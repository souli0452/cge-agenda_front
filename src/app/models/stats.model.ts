import { EventType } from './enums';
import { Event } from './event.model';

export interface DashboardStats {
    totalEvents: number;
    upcomingEventsCount: number;
    totalParticipants: number;
    eventsByStatus: { [key: string]: number };
    eventsByType: { [key: string]: number };
    upcomingEvents?: Event[];
    topEventTypes?: TypeStats[];
}

export interface TypeStats {
    type: EventType;
    count: number;
    percentage: number;
}

export interface MonthlyReport {
    month: number;
    year: number;
    totalEvents: number;
    totalParticipants: number;
    eventsByType: { [key: string]: number };
    eventsByStatus: { [key: string]: number };
    events: Event[];
}