export interface Schedule {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    dateJour: string;
    startTime: string;
    endTime: string;
    address?: string;
    eventId?: string;
}