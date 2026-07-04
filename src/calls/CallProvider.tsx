import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Room, RoomEvent, type Participant } from "livekit-client";
import { api } from "../api/client";
import type { CallInvite, CallKind, CallSignal } from "../api/types";
import {
  createCallRoom,
  ROOM_UPDATE_EVENTS,
  participantList,
} from "./room";

const RING_TIMEOUT_MS = 45000;

export type CallPhase = "idle" | "incoming" | "outgoing" | "active";

interface CallMeta {
  callId: string;
  kind: CallKind;
  title: string;
  isGroup: boolean;
}

export interface CallContextValue {
  phase: CallPhase;
  meta: CallMeta | null;
  invite: CallInvite | null;
  participants: Participant[];
  room: Room | null;
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  connected: boolean;
  error: string | null;
  startCall: (
    conversationId: string,
    kind: CallKind,
    title: string,
    isGroup: boolean,
  ) => void;
  accept: () => void;
  decline: () => void;
  hangup: () => void;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleScreen: () => void;
  // Socket signal sinks — wired by the workspace to the realtime connection.
  signals: {
    onInvite: (e: CallInvite) => void;
    onAccept: (e: CallSignal) => void;
    onDecline: (e: CallSignal) => void;
    onCancel: (e: CallSignal) => void;
    onEnd: (e: CallSignal) => void;
    onParticipantJoined: (e: CallSignal) => void;
    onParticipantLeft: (e: CallSignal) => void;
  };
}

const CallContext = createContext<CallContextValue | null>(null);
export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
};

export function CallProvider({
  selfId,
  children,
}: {
  selfId: string;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [meta, setMeta] = useState<CallMeta | null>(null);
  const [invite, setInvite] = useState<CallInvite | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const metaRef = useRef<CallMeta | null>(null);
  const phaseRef = useRef<CallPhase>("idle");
  const connectedRef = useRef(false);
  const ringTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLDivElement>(null);

  const setPhaseBoth = (p: CallPhase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const rebuild = useCallback(() => {
    const room = roomRef.current;
    setParticipants(room ? participantList(room) : []);
  }, []);

  const clearRing = () => {
    if (ringTimer.current) {
      window.clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
  };

  const teardown = useCallback(() => {
    clearRing();
    const room = roomRef.current;
    if (room) {
      room.remoteParticipants.forEach((p) =>
        p.trackPublications.forEach((pub) =>
          pub.track?.detach().forEach((el) => el.remove()),
        ),
      );
      room.removeAllListeners();
      room.disconnect();
      roomRef.current = null;
    }
    if (audioRef.current) audioRef.current.innerHTML = "";
    metaRef.current = null;
    connectedRef.current = false;
    setMeta(null);
    setInvite(null);
    setParticipants([]);
    setConnected(false);
    setPhaseBoth("idle");
  }, []);

  const connectRoom = useCallback(
    async (livekitUrl: string, token: string, callId: string, kind: CallKind) => {
      const room = createCallRoom();
      roomRef.current = room;
      ROOM_UPDATE_EVENTS.forEach((e) => room.on(e, rebuild));
      room.on(RoomEvent.Disconnected, () => teardown());

      // Attach remote audio as it arrives (camera-off participants too).
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "audio" && audioRef.current) {
          const el = track.attach();
          audioRef.current.appendChild(el);
        }
      });

      await room.connect(livekitUrl, token);
      try {
        await room.startAudio(); // unblock WKWebView autoplay (within gesture)
      } catch {
        /* will retry on next user interaction */
      }
      await room.localParticipant.setMicrophoneEnabled(true);
      setMicOn(true);
      if (kind === "VIDEO") {
        await room.localParticipant.setCameraEnabled(true);
        setCamOn(true);
      }
      await api.callMediaJoined(callId).catch(() => {});
      rebuild();
    },
    [rebuild, teardown],
  );

  const startCall = useCallback(
    async (
      conversationId: string,
      kind: CallKind,
      title: string,
      isGroup: boolean,
    ) => {
      if (phaseRef.current !== "idle") return;
      setError(null);
      setCamOn(kind === "VIDEO");
      setPhaseBoth("outgoing");
      try {
        const start = await api.startCall(conversationId, kind);
        const m: CallMeta = { callId: start.callId, kind, title, isGroup };
        metaRef.current = m;
        setMeta(m);
        await connectRoom(start.livekitUrl, start.token, start.callId, kind);
        // Ringback timeout — cancel if nobody joins.
        ringTimer.current = window.setTimeout(() => {
          if (!connectedRef.current) hangupRef.current();
        }, RING_TIMEOUT_MS);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start call");
        teardown();
      }
    },
    [connectRoom, teardown],
  );

  const accept = useCallback(async () => {
    const inv = invite;
    if (!inv) return;
    clearRing();
    const m: CallMeta = {
      callId: inv.callId,
      kind: inv.kind,
      title: inv.conversationTitle,
      isGroup: inv.conversationType === "GROUP",
    };
    metaRef.current = m;
    setMeta(m);
    setInvite(null);
    setPhaseBoth("active");
    try {
      const tok = await api.callToken(inv.callId);
      await connectRoom(tok.livekitUrl, tok.token, inv.callId, inv.kind);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join call");
      await api.callFail(inv.callId).catch(() => {});
      teardown();
    }
  }, [invite, connectRoom, teardown]);

  const decline = useCallback(() => {
    const inv = invite;
    if (inv) api.callDecline(inv.callId).catch(() => {});
    teardown();
  }, [invite, teardown]);

  const hangup = useCallback(() => {
    const m = metaRef.current;
    if (m) {
      if (phaseRef.current === "active" && connectedRef.current) {
        api.callEnd(m.callId).catch(() => {});
      } else {
        api.callCancel(m.callId).catch(() => {});
      }
    }
    teardown();
  }, [teardown]);

  // Stable ref so the ring timeout can call the latest hangup.
  const hangupRef = useRef(hangup);
  hangupRef.current = hangup;

  const toggleMic = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isMicrophoneEnabled;
    room.localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
    rebuild();
  }, [rebuild]);

  const toggleCam = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isCameraEnabled;
    room.localParticipant.setCameraEnabled(next);
    setCamOn(next);
    rebuild();
  }, [rebuild]);

  const toggleScreen = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !room.localParticipant.isScreenShareEnabled;
    try {
      await room.localParticipant.setScreenShareEnabled(next, {
        audio: true,
      });
      setScreenOn(next);
      rebuild();
    } catch (e) {
      // User cancelled the picker, or the OS denied screen-recording access.
      setError(
        e instanceof Error && /permission|denied|not allowed/i.test(e.message)
          ? "Screen sharing needs Screen Recording permission (System Settings › Privacy)."
          : "Couldn't start screen sharing.",
      );
      window.setTimeout(() => setError(null), 5000);
    }
  }, [rebuild]);

  // ---- Socket signals ----
  const markConnected = useCallback(() => {
    connectedRef.current = true;
    setConnected(true);
    if (phaseRef.current === "outgoing") setPhaseBoth("active");
  }, []);

  const signals = useMemo(
    () => ({
      onInvite: (e: CallInvite) => {
        if (phaseRef.current !== "idle" || e.silenced) {
          if (phaseRef.current !== "idle") api.callDecline(e.callId).catch(() => {});
          return;
        }
        setInvite(e);
        setPhaseBoth("incoming");
        clearRing();
        ringTimer.current = window.setTimeout(() => {
          api.callDecline(e.callId).catch(() => {});
          teardown();
        }, RING_TIMEOUT_MS);
      },
      onAccept: (e: CallSignal) => {
        if (e.userId && e.userId !== selfId) markConnected();
      },
      onParticipantJoined: (e: CallSignal) => {
        if (e.userId && e.userId !== selfId) markConnected();
      },
      onDecline: (e: CallSignal) => {
        const m = metaRef.current;
        if (!m || m.callId !== e.callId) return;
        if (!m.isGroup) teardown(); // group: one decline doesn't end the call
      },
      onCancel: (e: CallSignal) => {
        const m = metaRef.current;
        const inv = invite;
        if ((m && m.callId === e.callId) || (inv && inv.callId === e.callId)) {
          teardown();
        }
      },
      onEnd: (e: CallSignal) => {
        const m = metaRef.current;
        const inv = invite;
        if ((m && m.callId === e.callId) || (inv && inv.callId === e.callId)) {
          teardown();
        }
      },
      onParticipantLeft: (_e: CallSignal) => {
        /* LiveKit's own disconnect grace removes the tile */
      },
    }),
    [selfId, invite, teardown, markConnected],
  );

  const value: CallContextValue = {
    phase,
    meta,
    invite,
    participants,
    room: roomRef.current,
    micOn,
    camOn,
    screenOn,
    connected,
    error,
    startCall,
    accept,
    decline,
    hangup,
    toggleMic,
    toggleCam,
    toggleScreen,
    signals,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      <div ref={audioRef} style={{ display: "none" }} aria-hidden />
    </CallContext.Provider>
  );
}
