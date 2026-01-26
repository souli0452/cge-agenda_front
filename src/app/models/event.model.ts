import { EventType, EventStatus } from './enums';
import { Participant } from './participant.model';
import { Schedule } from './schedule.model';
import { FileUpload } from './file.model';

export interface Event {
  // Audit fields
  id?: string;
  createdAt?: string;
  updatedAt?: string;

  // Event fields
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  globalStartTime?: string;
  globalEndTime?: string;
  meetingLink?: string;
  pays?: string;
  ville?: string;
  status: EventStatus;
  type: EventType;

  // Relations
  schedules?: Schedule[];
  files?: FileUpload[];
  participants?: Participant[];

  // tructures uniques des participants
  structures?: string[];
}