import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "./external";

describe("safeHttpUrl", () => {
  it("accepts http and https URLs and normalizes them", () => {
    expect(safeHttpUrl("https://example.com")).toBe("https://example.com/");
    expect(safeHttpUrl("http://EXAMPLE.com/a b")).toBe(
      "http://example.com/a%20b",
    );
  });

  it.each([
    "javascript:alert(1)",
    "file:///etc/passwd",
    "mailto:someone@example.com",
    "data:text/html,<script>alert(1)</script>",
    "klic://add?username=test",
  ])("rejects non-http(s) scheme %s", (raw) => {
    expect(safeHttpUrl(raw)).toBeNull();
  });

  it("rejects empty and malformed input", () => {
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
    expect(safeHttpUrl("")).toBeNull();
    expect(safeHttpUrl("example.com")).toBeNull();
    expect(safeHttpUrl("https://")).toBeNull();
  });
});
