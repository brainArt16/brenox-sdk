import type { HttpClient } from "../http";
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  TokenResponse,
} from "../types/api";

export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  async register(input: RegisterInput): Promise<AuthUser> {
    return this.http.request<AuthUser>("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    });
  }

  async login(input: LoginInput): Promise<TokenResponse> {
    const response = await this.http.request<TokenResponse>("/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    });
    await this.http.setToken(response.token);
    return response;
  }

  async refresh(): Promise<TokenResponse> {
    const token = await this.http.refreshToken();
    if (!token) {
      throw new Error("no token to refresh");
    }
    return { token };
  }

  async logout(): Promise<void> {
    await this.http.setToken(null);
  }
}
