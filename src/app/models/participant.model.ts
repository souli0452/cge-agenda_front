import { ParticipantType } from './enums';

export interface Participant {
    // Audit fields
    id?: string;
    createdAt?: string;
    updatedAt?: string;

    // Participant fields
    lastName: string;
    firstName: string;
    email: string;
    phoneNumber?: string;
    jobTitle?: string;
    structure?: string;
    participantType: ParticipantType;
}