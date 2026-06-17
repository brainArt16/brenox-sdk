import type { HttpClient } from "../http";
import type {
  CreateWorkspaceInput,
  Workspace,
  WorkspaceListItem,
} from "../types/api";

export class WorkspacesResource {
  constructor(private readonly http: HttpClient) {}

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    return this.http.request<Workspace>("/api/workspaces", {
      method: "POST",
      body: input,
    });
  }

  async list(): Promise<WorkspaceListItem[]> {
    const response = await this.http.request<{ workspaces: WorkspaceListItem[] }>(
      "/api/workspaces",
    );
    return response.workspaces;
  }

  async get(workspaceId: number): Promise<Workspace> {
    return this.http.request<Workspace>(`/api/workspaces/${workspaceId}`);
  }
}
