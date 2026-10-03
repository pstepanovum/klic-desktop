// Split sentence punctuation off the end of a linkified URL. A closing paren is
// kept when it balances one inside the URL (e.g. Wikipedia "Foo_(bar)").
export function splitTrail(p: string): [string, string] {
  let end = p.length;
  while (end > 0) {
    const c = p[end - 1];
    const head = p.slice(0, end);
    const unbalanced =
      c === ")" && head.split("(").length < head.split(")").length;
    if (!".,!?;:'\"]".includes(c) && !unbalanced) break;
    end--;
  }
  return [p.slice(0, end), p.slice(end)];
}
