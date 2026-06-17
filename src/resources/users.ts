import type { HttpClient } from "../http";
import type { UpdateProfileInput, UserProfile } from "../types/api";

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  async me(): Promise<UserProfile> {
    return this.http.request<UserProfile>("/api/users/me");
  }

  async updateMe(input: UpdateProfileInput): Promise<UserProfile> {
    return this.http.request<UserProfile>("/api/users/me", {
      method: "PATCH",
      body: input,
    });
  }
}
