export interface FileUpload {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    fileName: string;
    filePath: string;
    fileType?: string;
    fileSize?: number;
    description?: string;
    eventId?: string;
}