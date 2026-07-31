import type { HttpClient } from "../http";
import type {
  Attachment,
  AttachmentInput,
  CreateUploadInput,
  UploadedFileMeta,
  UploadUrl,
} from "../types/attachments";

export interface UploadFileOptions {
  fetch?: typeof fetch;
}

export class AttachmentsResource {
  constructor(private readonly http: HttpClient) {}

  async createUploadUrl(input: CreateUploadInput): Promise<UploadUrl> {
    return this.http.request<UploadUrl>("/api/uploads", {
      method: "POST",
      body: input,
    });
  }

  /**
   * Request a presigned URL and PUT the file bytes to object storage.
   */
  async uploadFile(
    file: Blob,
    meta: { fileName: string; mimeType: string },
    options: UploadFileOptions = {},
  ): Promise<UploadedFileMeta> {
    const upload = await this.createUploadUrl({
      file_name: meta.fileName,
      mime_type: meta.mimeType,
      size_bytes: file.size,
    });

    const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    const putResponse = await fetchFn(upload.upload_url, {
      method: "PUT",
      headers: { "Content-Type": meta.mimeType },
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error(`upload failed with status ${putResponse.status}`);
    }

    return {
      object_key: upload.object_key,
      file_name: meta.fileName,
      mime_type: meta.mimeType,
      size_bytes: file.size,
    };
  }

  async attachToMessage(
    workspaceId: number,
    channelId: number,
    messageId: number,
    attachments: AttachmentInput[],
  ): Promise<Attachment[]> {
    const response = await this.http.request<{ attachments: Attachment[] }>(
      `/api/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/attachments`,
      {
        method: "POST",
        body: { attachments },
      },
    );
    return response.attachments;
  }

  async listByMessage(
    workspaceId: number,
    channelId: number,
    messageId: number,
  ): Promise<Attachment[]> {
    const response = await this.http.request<{ attachments: Attachment[] }>(
      `/api/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/attachments`,
    );
    return response.attachments;
  }

  /** Absolute API URL for streaming attachment bytes (requires auth). */
  contentUrl(
    workspaceId: number,
    channelId: number,
    messageId: number,
    attachmentId: number,
  ): string {
    return `${this.http.getBaseUrl()}/api/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/attachments/${attachmentId}/content`;
  }

  /**
   * Fetch attachment bytes with the session token.
   * Prefer this over opening `attachment.url` directly so storage paths stay hidden.
   */
  async fetchContent(
    workspaceId: number,
    channelId: number,
    messageId: number,
    attachmentId: number,
  ): Promise<Blob> {
    return this.http.requestBlob(
      `/api/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/attachments/${attachmentId}/content`,
    );
  }

  /** Fetch content and return a short-lived blob: URL (revoke when done). */
  async createObjectUrl(
    workspaceId: number,
    channelId: number,
    messageId: number,
    attachmentId: number,
  ): Promise<string> {
    const blob = await this.fetchContent(
      workspaceId,
      channelId,
      messageId,
      attachmentId,
    );
    return URL.createObjectURL(blob);
  }
}
