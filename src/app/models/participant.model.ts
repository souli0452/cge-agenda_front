import { ParticipantType } from './enums';

export interface Participant {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    lastName: string;
    firstName: string;
    email: string;
    phoneNumber?: string;
    jobTitle?: string;
    structure?: string;
    participantType: ParticipantType;
}