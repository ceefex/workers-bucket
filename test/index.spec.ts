import {
	env,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("R2 proxy worker", () => {
	it("serves objects with configured MIME and CORS headers", async () => {
		const key = `vitest-${crypto.randomUUID()}.txt`;
		await env.R2_BUCKET.put(key, "proxy response");

		try {
			const response = await SELF.fetch(`https://example.com/${key}`, {
					headers: { Origin: "https://cdn.dyzulk.com" },
			});

			expect(await response.text()).toBe("proxy response");
			expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
				expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://cdn.dyzulk.com");
		} finally {
			await env.R2_BUCKET.delete(key);
		}
	});

	it("handles preflight and missing objects", async () => {
		const preflight = await SELF.fetch("https://example.com/file.txt", { method: "OPTIONS" });
		const missing = await SELF.fetch(`https://example.com/missing-${crypto.randomUUID()}`);

		expect(preflight.status).toBe(204);
		expect(preflight.headers.get("Access-Control-Allow-Methods")).toBe("GET, HEAD, OPTIONS");
		expect(missing.status).toBe(404);
	});

	it("supports HEAD without returning an object body", async () => {
		const key = `vitest-${crypto.randomUUID()}.txt`;
		await env.R2_BUCKET.put(key, "head response");

		try {
			const response = await SELF.fetch(`https://example.com/${key}`, { method: "HEAD" });
			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Length")).toBe("13");
			expect(await response.text()).toBe("");
		} finally {
			await env.R2_BUCKET.delete(key);
		}
	});
});
