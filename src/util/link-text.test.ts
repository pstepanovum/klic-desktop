import { describe, expect, it } from "vitest";
import { splitTrail } from "./link-text";

describe("splitTrail", () => {
  it("leaves a clean URL alone", () => {
    expect(splitTrail("https://example.com/a")).toEqual([
      "https://example.com/a",
      "",
    ]);
  });

  it.each([".", ",", "!", "?", ";", ":", "'", '"', "]", "...", "?!"])(
    "splits trailing %j off the URL",
    (punct) => {
      expect(splitTrail(`https://example.com${punct}`)).toEqual([
        "https://example.com",
        punct,
      ]);
    },
  );

  it("keeps a closing paren that balances one in the URL", () => {
    const url = "https://en.wikipedia.org/wiki/Foo_(bar)";
    expect(splitTrail(url)).toEqual([url, ""]);
    expect(splitTrail(`${url}.`)).toEqual([url, "."]);
  });

  it("splits an unbalanced closing paren (URL wrapped in parentheses)", () => {
    expect(splitTrail("https://example.com/x)")).toEqual([
      "https://example.com/x",
      ")",
    ]);
    expect(splitTrail("https://example.com/x).")).toEqual([
      "https://example.com/x",
      ").",
    ]);
  });

  it("keeps punctuation in the middle of the URL", () => {
    expect(splitTrail("https://example.com/a.b?c=d,e")).toEqual([
      "https://example.com/a.b?c=d,e",
      "",
    ]);
  });
});
