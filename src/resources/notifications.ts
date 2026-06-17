import type { HttpClient } from "../http";
import type {
  ListNotificationsParams,
  MarkAllReadResult,
  Notification,
} from "../types/notifications";

export class NotificationsResource {
  constructor(private readonly http: HttpClient) {}

  async list(params: ListNotificationsParams = {}): Promise<Notification[]> {
    const response = await this.http.request<{ notifications: Notification[] }>(
      "/api/notifications",
      {
        query: {
          limit: params.limit,
          offset: params.offset,
        },
      },
    );
    return response.notifications;
  }

  async markRead(notificationId: number): Promise<Notification> {
    return this.http.request<Notification>(
      `/api/notifications/${notificationId}/read`,
      { method: "PATCH", body: {} },
    );
  }

  async markAllRead(): Promise<MarkAllReadResult> {
    return this.http.request<MarkAllReadResult>("/api/notifications/read-all", {
      method: "POST",
      body: {},
    });
  }
}
