import { describe, expect, it } from "vitest";
import { BrenoxClient } from "../../src/client";

const baseUrl = process.env.BRENOX_URL ?? "http://localhost:8080";

async function isApiUp(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

describe("integration smoke", () => {
  it("register → login → workspace → channel → message", async () => {
    if (!(await isApiUp())) {
      console.warn(`Skipping: Brenox API not reachable at ${baseUrl}`);
      return;
    }

    const suffix = Date.now();
    const email = `sdk-${suffix}@example.com`;
    const username = `sdk_user_${suffix}`;

    const client = new BrenoxClient({ baseUrl });

    const user = await client.auth.register({
      email,
      username,
      password: "password123",
    });
    expect(user.email).toBe(email);

    const { token } = await client.auth.login({
      email,
      password: "password123",
    });
    expect(token).toBeTruthy();

    const workspace = await client.workspaces.create({
      name: `SDK Workspace ${suffix}`,
      slug: `sdk-${suffix}`,
    });
    expect(workspace.id).toBeGreaterThan(0);

    const channel = await client.channels.create(workspace.id, {
      name: "general",
    });
    expect(channel.ID).toBeGreaterThan(0);

    const message = await client.messages.send(workspace.id, channel.ID, {
      content: "hello from @brenox/sdk",
    });
    expect(message.content).toBe("hello from @brenox/sdk");

    const history = await client.messages.list(workspace.id, channel.ID, {
      limit: 10,
    });
    expect(history.some((item) => item.id === message.id)).toBe(true);

    const profile = await client.users.me();
    expect(profile.email).toBe(email);
  });
});
