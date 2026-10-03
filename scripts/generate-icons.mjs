// Converts the Android VectorDrawable icon set (ic_klic_*.xml) into a typed
// React icon module. Fill/stroke colors are dropped in favor of `currentColor`
// so every icon is theme-colorable. Re-run with:
//   node scripts/generate-icons.mjs <android-drawable-dir>
// Only icons referenced as string literals under src/ are emitted, since <Icon>
// looks names up dynamically and the bundler can't tree-shake the table. Pass
// --all to emit the full set, or --prune to re-filter the existing output
// without the Android sources (e.g. after removing an icon usage).
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const ALL = args.includes("--all");
const PRUNE = args.includes("--prune");
const SRC =
  args.find((a) => !a.startsWith("--")) ||
  join(__dirname, "..", "..", "klic-mobile-android", "app", "src", "main", "res", "drawable");
const OUT = join(__dirname, "..", "src", "icons", "icons.generated.ts");

// Every quoted string in src/ (excluding the generated table itself).
function usedStrings() {
  const out = new Set();
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f) && p !== OUT) {
        for (const m of readFileSync(p, "utf8").matchAll(/["'`]([a-z0-9_]+)["'`]/g)) out.add(m[1]);
      }
    }
  };
  walk(join(__dirname, "..", "src"));
  return out;
}

const attr = (block, name) => {
  const m = block.match(new RegExp(`android:${name}="([^"]*)"`, "s"));
  return m ? m[1] : undefined;
};
const capMap = { butt: "butt", round: "round", square: "square" };

function convert(xml) {
  const vw = attr(xml, "viewportWidth") || "24";
  const vh = attr(xml, "viewportHeight") || "24";
  const paths = [];
  const pathRe = /<path\b([\s\S]*?)\/>/g;
  let m;
  while ((m = pathRe.exec(xml))) {
    const block = m[1];
    const d = attr(block, "pathData");
    if (!d) continue;
    const strokeColor = attr(block, "strokeColor");
    const fillColorRaw = attr(block, "fillColor");
    const hasFill =
      fillColorRaw !== undefined &&
      fillColorRaw !== "#00000000" &&
      fillColorRaw.toLowerCase() !== "@android:color/transparent";
    const p = { d: d.replace(/\s+/g, " ").trim() };
    if (strokeColor) {
      p.stroke = true;
      p.sw = attr(block, "strokeWidth") || "1.5";
      const cap = attr(block, "strokeLineCap");
      if (cap && capMap[cap]) p.cap = capMap[cap];
      const join = attr(block, "strokeLineJoin");
      if (join) p.join = join;
    }
    // A path with no stroke is a filled shape; also fill when both are present.
    if (!strokeColor || hasFill) p.fill = true;
    const ft = attr(block, "fillType");
    if (ft && ft.toLowerCase() === "evenodd") p.evenodd = true;
    paths.push(p);
  }
  return { vw, vh, paths };
}

// Port the Klic UI set (ic_klic_*) plus the bold/line glyph sets used for call
// controls and actions (ic_bold_* -> bold_*, ic_line_* -> line_*).
const PREFIXES = [
  ["ic_klic_", ""],
  ["ic_bold_", "bold_"],
  ["ic_line_", "line_"],
];

function loadEntries() {
  if (PRUNE) {
    // Re-read the previously generated table: `  "name": { vw: N, vh: N, paths: [ ... ] }`.
    const text = readFileSync(OUT, "utf8");
    const re = /^  "([^"]+)": \{ vw: ([\d.]+), vh: ([\d.]+), paths: \[\n([\s\S]*?)\n  \] \}/gm;
    return [...text.matchAll(re)].map((m) => ({
      name: m[1],
      vw: m[2],
      vh: m[3],
      paths: m[4].split(",\n").map((l) => JSON.parse(l.trim())),
    }));
  }
  return fromAndroid();
}

function fromAndroid() {
const files = readdirSync(SRC)
  .filter(
    (f) =>
      f.endsWith(".xml") &&
      PREFIXES.some(([p]) => f.startsWith(p)),
  )
  .sort();

const seen = new Set();
const entries = [];
for (const file of files) {
  const pref = PREFIXES.find(([p]) => file.startsWith(p));
  const name =
    pref[1] + file.replace(pref[0], "").replace(/\.xml$/, "");
  if (seen.has(name)) continue;
  seen.add(name);
  const { vw, vh, paths } = convert(readFileSync(join(SRC, file), "utf8"));
  entries.push({ name, vw, vh, paths });
}
return entries;
}

const loaded = loadEntries();
const used = ALL ? null : usedStrings();
const entries = used ? loaded.filter((e) => used.has(e.name)) : loaded;

const header = `// AUTO-GENERATED from Android VectorDrawable ic_klic_*.xml. Do not edit by hand.
// Regenerate: node scripts/generate-icons.mjs
export interface IconPath {
  d: string;
  stroke?: boolean;
  fill?: boolean;
  sw?: string;
  cap?: "butt" | "round" | "square";
  join?: string;
  evenodd?: boolean;
}
export interface IconDef {
  vw: number;
  vh: number;
  paths: IconPath[];
}
export type IconName =
${entries.map((e) => `  | "${e.name}"`).join("\n")};

export const ICONS: Record<IconName, IconDef> = {
`;

const body = entries
  .map((e) => {
    const paths = e.paths
      .map((p) => "    " + JSON.stringify(p))
      .join(",\n");
    return `  "${e.name}": { vw: ${e.vw}, vh: ${e.vh}, paths: [\n${paths}\n  ] }`;
  })
  .join(",\n");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, header + body + "\n};\n");
console.log(`Wrote ${entries.length} of ${loaded.length} icons to ${OUT}`);
