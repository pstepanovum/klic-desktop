// Converts the Android VectorDrawable icon set (ic_klic_*.xml) into a typed
// React icon module. Fill/stroke colors are dropped in favor of `currentColor`
// so every icon is theme-colorable. Re-run with:
//   node scripts/generate-icons.mjs <android-drawable-dir>
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC =
  process.argv[2] ||
  "/Users/pavelstepanov/Projects/Klic/klic-mobile-android/app/src/main/res/drawable";
const OUT = join(__dirname, "..", "src", "icons", "icons.generated.ts");

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

const files = readdirSync(SRC)
  .filter((f) => f.startsWith("ic_klic_") && f.endsWith(".xml"))
  .sort();

const entries = [];
for (const file of files) {
  const name = file.replace(/^ic_klic_/, "").replace(/\.xml$/, "");
  const { vw, vh, paths } = convert(readFileSync(join(SRC, file), "utf8"));
  entries.push({ name, vw, vh, paths });
}

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
console.log(`Wrote ${entries.length} icons to ${OUT}`);
