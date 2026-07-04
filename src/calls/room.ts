// LiveKit room factory + track helpers, tuned for a desktop group-call grid.
import {
  Room,
  RoomEvent,
  Track,
  VideoPresets,
  type Participant,
  type RemoteTrack,
} from "livekit-client";

export function createCallRoom(): Room {
  return new Room({
    adaptiveStream: true,
    dynacast: true,
    publishDefaults: {
      simulcast: true,
      videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360, VideoPresets.h720],
      videoCodec: "vp8", // safe across WebKit/WKWebView
      dtx: true,
      red: true,
    },
    videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    stopLocalTrackOnUnpublish: true,
  });
}

export const ROOM_UPDATE_EVENTS: RoomEvent[] = [
  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.TrackSubscribed,
  RoomEvent.TrackUnsubscribed,
  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished,
  RoomEvent.ActiveSpeakersChanged,
  RoomEvent.ConnectionQualityChanged,
];

export function participantList(room: Room): Participant[] {
  return [room.localParticipant, ...Array.from(room.remoteParticipants.values())];
}

export function cameraTrack(p: Participant) {
  const pub = p.getTrackPublication(Track.Source.Camera);
  return pub?.videoTrack ?? null;
}

export function isCameraEnabled(p: Participant): boolean {
  const pub = p.getTrackPublication(Track.Source.Camera);
  return !!pub && !pub.isMuted && !!pub.track;
}

export function isMicEnabled(p: Participant): boolean {
  const pub = p.getTrackPublication(Track.Source.Microphone);
  // No publication yet = treat as muted.
  return !!pub && !pub.isMuted;
}

// Attach every subscribed remote audio track to hidden elements so the call is
// audible even for camera-off participants (WKWebView autoplay handled by the
// caller via room.startAudio() inside the accept/start gesture).
export function bindRemoteAudio(room: Room, container: HTMLElement): () => void {
  const attach = (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    const el = track.attach();
    el.setAttribute("data-sid", track.sid ?? "");
    container.appendChild(el);
  };
  const detach = (track: RemoteTrack) => {
    if (track.kind !== Track.Kind.Audio) return;
    track.detach().forEach((el) => el.remove());
  };
  room.on(RoomEvent.TrackSubscribed, attach);
  room.on(RoomEvent.TrackUnsubscribed, detach);
  // Sweep already-subscribed audio.
  room.remoteParticipants.forEach((p) =>
    p.trackPublications.forEach((pub) => {
      if (pub.track && pub.kind === Track.Kind.Audio) attach(pub.track as RemoteTrack);
    }),
  );
  return () => {
    room.off(RoomEvent.TrackSubscribed, attach);
    room.off(RoomEvent.TrackUnsubscribed, detach);
    container.querySelectorAll("audio").forEach((el) => el.remove());
  };
}

// Non-scrolling grid column count by participant count (CALLS.md §17).
export function gridColumns(count: number): number {
  if (count <= 1) return 1;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 2;
  if (count <= 12) return 3;
  return 4;
}
