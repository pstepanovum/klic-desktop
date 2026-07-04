import { useState } from "react";
import { initials } from "../util/format";

interface Props {
  url: string | null;
  name: string;
  size?: "sm" | "md";
}

// Renders a presigned/redirect avatar URL, falling back to initials on error
// or when no URL is available.
export function Avatar({ url, name, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);
  const cls = size === "sm" ? "avatar sm" : "avatar";
  if (url && !failed) {
    return (
      <img
        className={`${cls} avatar-img`}
        src={url}
        alt={name}
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className={`${cls} avatar-initials`}>{initials(name)}</span>;
}
