import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("health check", () => {
  it("returns the status and the package version only", async () => {
    const { api } = setup();
    const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };

    const res = await api.get("/health").expect(200);

    expect(res.body).toEqual({ status: "ok", version });
  });
});
