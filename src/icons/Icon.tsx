import { ICONS, type IconName, type IconDef } from "./icons.generated";

export type { IconName };

// Hand-added glyphs that match the ic_line stroke aesthetic (24px, 1.5 stroke,
// round caps). Rendered with currentColor like the generated set.
const CUSTOM: Record<string, IconDef> = {
  smile: {
    vw: 24,
    vh: 24,
    paths: [
      {
        d: "M7.81409 15.25C8.43432 15.8117 9.93703 16.94 11.9999 16.94C14.0629 16.94 15.5656 15.8117 16.1858 15.25M7 10C7.22226 9.86707 7.76076 9.6 8.5 9.6C9.23924 9.6 9.77774 9.86707 10 10M14 10C14.2223 9.86707 14.7608 9.6 15.5 9.6C16.2392 9.6 16.7777 9.86707 17 10M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z",
        stroke: true,
        sw: "1.5",
        cap: "round",
      },
    ],
  },
  paperplane: {
    vw: 24,
    vh: 24,
    paths: [
      {
        d: "M2.3416 8.35984L21.3416 2.0265C21.7321 1.89632 22.1037 2.26786 21.9735 2.65839L15.6402 21.6584C15.4949 22.0942 14.888 22.1194 14.7071 21.6972L11.73 14.7508C11.6625 14.5933 11.6805 14.4122 11.7776 14.271L15.9787 8.16021C16.0415 8.06889 15.9311 7.9585 15.8398 8.02127L9.729 12.2224C9.5878 12.3195 9.4067 12.3375 9.2492 12.27L2.30279 9.29292C1.88058 9.11197 1.90582 8.50509 2.3416 8.35984Z",
        stroke: true,
        sw: "1.5",
        cap: "round",
      },
    ],
  },
};

export type AnyIconName = IconName | keyof typeof CUSTOM;

interface Props {
  name: AnyIconName;
  size?: number;
  className?: string;
  title?: string;
}

// Renders a ported ic_klic_* icon as inline SVG. All paths use `currentColor`
// (fill or stroke) so an icon takes the CSS color of its context.
export function Icon({ name, size = 22, className, title }: Props) {
  const def = CUSTOM[name] ?? ICONS[name as IconName];
  if (!def) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${def.vw} ${def.vh}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {def.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill ? "currentColor" : "none"}
          fillRule={p.evenodd ? "evenodd" : undefined}
          clipRule={p.evenodd ? "evenodd" : undefined}
          stroke={p.stroke ? "currentColor" : undefined}
          strokeWidth={p.stroke ? p.sw : undefined}
          strokeLinecap={p.cap}
          strokeLinejoin={p.join as never}
        />
      ))}
    </svg>
  );
}

// True when an icon with this name exists in the ported set.
export function hasIcon(name: string): name is IconName {
  return name in ICONS;
}
