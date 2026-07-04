import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Sticker } from "../api/types";

// Sticker grid popover. Lists the server catalog (GET /stickers) and renders the
// presigned SVG URLs directly; picking one sends it.
export function StickerPicker({
  onPick,
  onClose,
}: {
  onPick: (stickerId: string) => void;
  onClose: () => void;
}) {
  const [stickers, setStickers] = useState<Sticker[] | null>(null);

  useEffect(() => {
    api
      .stickers()
      .then((r) => setStickers(r.stickers.filter((s) => s.url)))
      .catch(() => setStickers([]));
  }, []);

  return (
    <>
      <div className="sticker-backdrop" onClick={onClose} />
      <div className="sticker-popover">
        {stickers === null ? (
          <div className="list-empty">Loading…</div>
        ) : stickers.length === 0 ? (
          <div className="list-empty">No stickers available.</div>
        ) : (
          <div className="sticker-grid">
            {stickers.map((s) => (
              <button
                key={s.id}
                className="sticker-cell"
                onClick={() => {
                  onPick(s.id);
                  onClose();
                }}
              >
                <img src={s.url} alt={s.id} loading="lazy" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
