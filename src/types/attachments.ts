export interface CreateUploadInput {
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface UploadUrl {
  object_key: string;
  upload_url: string;
  expires_at: string;
}

export interface AttachmentInput {
  object_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface Attachment {
  id: number;
  message_id: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  created_at: string;
}

export interface UploadedFileMeta {
  object_key: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
}
