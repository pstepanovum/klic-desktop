import { ICONS, type IconName } from "./icons.generated";

export type { IconName };

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}

// Renders a ported ic_klic_* icon as inline SVG. All paths use `currentColor`
// (fill or stroke) so an icon takes the CSS color of its context.
export function Icon({ name, size = 22, className, title }: Props) {
  const def = ICONS[name];
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
