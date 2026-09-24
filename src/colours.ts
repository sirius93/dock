// Fixed palette so colours stay stable and distinguishable; assigned round-robin
// by order of first appearance. Editable later from the options page (F4).
const PALETTE = [
  "#4285F4", // blue
  "#EA4335", // red
  "#34A853", // green
  "#FBBC05", // yellow
  "#9334E6", // purple
  "#F439A0", // pink
  "#00ACC1", // teal
  "#FF6D01", // orange
];

export function colourForIndex(index: number): string {
  return PALETTE[index % PALETTE.length] ?? PALETTE[0]!;
}

export function assignColour(
  email: string,
  existing: Record<string, string>,
): string {
  if (existing[email]) return existing[email];
  return colourForIndex(Object.keys(existing).length);
}
