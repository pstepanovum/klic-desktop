import { Icon } from "../icons/icon";

// Full-window image preview; click anywhere (or the close button) to dismiss.
export function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="image-viewer" onClick={onClose}>
      <img src={src} alt="preview" />
      <button className="image-viewer-close" onClick={onClose}>
        <Icon name="close" size={22} />
      </button>
    </div>
  );
}
