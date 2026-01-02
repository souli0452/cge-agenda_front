export interface Schedule {
    // Audit fields
    id?: string;
    createdAt?: string;
    updatedAt?: string;

    // Schedule fields
    dateJour: string;
    startTime: string;
    endTime: string;
    address?: string;
    eventId?: string;
}