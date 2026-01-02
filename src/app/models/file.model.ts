export interface FileUpload {
    // Audit fields
    id?: string;
    createdAt?: string;
    updatedAt?: string;

    // File fields
    fileName: string;
    filePath: string;
    fileType?: string;
    fileSize?: number;
    description?: string;
    eventId?: string;
}