import { describe, expect, it } from "vitest";
import { assignColour, colourForIndex } from "../src/colours";

describe("assignColour", () => {
  it("gives a new email the next unused palette colour", () => {
    const existing = { "a@x.com": colourForIndex(0) };
    expect(assignColour("b@x.com", existing)).toBe(colourForIndex(1));
  });

  it("returns the same colour for an already-assigned email", () => {
    const existing = { "a@x.com": colourForIndex(0) };
    expect(assignColour("a@x.com", existing)).toBe(colourForIndex(0));
  });
});
