import type { ReactNode } from "react";
import type { Visibility } from "../../api/types";

export function Switch({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className={`switch ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
    >
      <span className="knob" />
    </button>
  );
}

export function ToggleRow({
  label,
  sub,
  on,
  onChange,
}: {
  label: string;
  sub?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <div>
        <div className="tr-label">{label}</div>
        {sub && <div className="tr-sub">{sub}</div>}
      </div>
      <Switch on={on} onChange={onChange} />
    </div>
  );
}

const VIS: Visibility[] = ["EVERYBODY", "FRIENDS", "NOBODY"];
const VIS_LABEL: Record<Visibility, string> = {
  EVERYBODY: "Everybody",
  FRIENDS: "Friends",
  NOBODY: "Nobody",
};

export function VisibilityPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Visibility;
  onChange: (v: Visibility) => void;
}) {
  return (
    <div className="picker-row">
      <span className="pr-label">{label}</span>
      <select
        className="select-input"
        style={{ width: 150 }}
        value={value}
        onChange={(e) => onChange(e.target.value as Visibility)}
      >
        {VIS.map((v) => (
          <option key={v} value={v}>
            {VIS_LABEL[v]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <h2 className="settings-h">{title}</h2>
      {subtitle && <p className="settings-sub">{subtitle}</p>}
    </>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="field-group">
      <label>{label}</label>
      {children}
    </div>
  );
}
