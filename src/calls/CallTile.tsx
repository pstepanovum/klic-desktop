import { useEffect, useRef } from "react";
import { Track, type Participant } from "livekit-client";
import { Icon } from "../icons/Icon";
import { initials } from "../util/format";
import { isCameraEnabled, isMicEnabled } from "./room";

interface Props {
  participant: Participant;
  local: boolean;
  label: string;
}

// One video tile. Attaches the camera track to a <video>; falls back to an
// avatar when the camera is off. Shows a speaking glow and a mute badge.
export function CallTile({ participant, local, label }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const camOn = isCameraEnabled(participant);
  const micOn = isMicEnabled(participant);
  const speaking = participant.isSpeaking;

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const pub = participant.getTrackPublication(Track.Source.Camera);
    const track = pub?.videoTrack;
    if (track && camOn) {
      track.attach(el);
      return () => {
        track.detach(el);
      };
    }
  }, [participant, camOn]);

  return (
    <div className={`call-tile ${speaking ? "speaking" : ""}`}>
      {camOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={local}
          className={local ? "mirror" : ""}
        />
      ) : (
        <div className="call-avatar">{initials(label)}</div>
      )}
      <div className="call-tile-label">
        {!micOn && (
          <span className="call-mute-badge">
            <Icon name="slash_circle" size={13} />
          </span>
        )}
        <span>{local ? "You" : label}</span>
      </div>
    </div>
  );
}
