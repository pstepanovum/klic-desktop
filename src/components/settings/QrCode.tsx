import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import type { SelfUser } from "../../api/types";
import { PageHeader } from "./ui";

// Encodes the same profile deep link the mobile apps use.
const profileLink = (username: string) =>
  `https://klic.pstepanov.dev/u/${username}`;

export function QrCode({ self }: { self: SelfUser }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const link = profileLink(self.username);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, link, {
        width: 240,
        margin: 1,
        color: { dark: "#111111", light: "#ffffff" },
      }).catch(() => {});
    }
  }, [link]);

  return (
    <div className="settings-detail-inner" style={{ textAlign: "center" }}>
      <PageHeader
        title="Your QR code"
        subtitle="Others can scan this to add you on Klic."
      />
      <canvas ref={canvasRef} className="qr-canvas" width={240} height={240} />
      <div className="settings-profile-name">{self.displayName}</div>
      <div className="settings-profile-user">@{self.username}</div>
      <div className="info-card" style={{ marginTop: 20, textAlign: "left" }}>
        {link}
      </div>
    </div>
  );
}
