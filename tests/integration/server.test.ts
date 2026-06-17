import { describe, expect, it } from "vitest";
import { BrenoxClient } from "../../src/client";
import { BrenoxServer } from "../../src/server";

const baseUrl = process.env.BRENOX_URL ?? "http://localhost:8080";

async function isApiUp(): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

describe("integration developer API", () => {
  it("create app → API key → provision user → channel → message", async () => {
    if (!(await isApiUp())) {
      console.warn(`Skipping: Brenox API not reachable at ${baseUrl}`);
      return;
    }

    const suffix = Date.now();
    const client = new BrenoxClient({ baseUrl });

    await client.auth.register({
      email: `dev${suffix}@example.com`,
      username: `dev_${suffix}`,
      password: "password123",
    });
    await client.auth.login({
      email: `dev${suffix}@example.com`,
      password: "password123",
    });

    const app = await client.apps.create({
      name: `SDK App ${suffix}`,
      slug: `sdk-app-${suffix}`,
    });

    const apiKey = await client.apps.createKey(app.id, {
      name: "integration",
      sandbox: true,
    });
    expect(apiKey.secret).toMatch(/^bx_test_/);

    const server = new BrenoxServer({
      baseUrl,
      apiKey: apiKey.secret,
    });

    const user = await server.users.provision({
      external_id: `ext-${suffix}`,
      username: `bot_${suffix}`,
    });
    expect(user.external_id).toBe(`ext-${suffix}`);

    const channel = await server.channels.create({ name: "bot-channel" });
    expect(channel.id).toBeGreaterThan(0);

    const message = await server.messages.send({
      channel_id: channel.id,
      external_id: user.external_id,
      content: "hello from BrenoxServer",
    });
    expect(message.content).toBe("hello from BrenoxServer");

    const history = await server.messages.list({
      channel_id: channel.id,
      limit: 10,
    });
    expect(history.some((item) => item.id === message.id)).toBe(true);
  });
});
