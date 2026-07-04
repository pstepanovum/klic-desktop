import { Icon } from "../icons/icon";
import { initials } from "../util/format";
import { useCall } from "./call-provider";

// Ringing overlay for an inbound call (socket call:invite → accept/decline).
export function IncomingCall() {
  const { invite, accept, decline } = useCall();
  if (!invite) return null;

  const who =
    invite.conversationType === "GROUP"
      ? invite.conversationTitle
      : invite.from.displayName;

  return (
    <div className="incoming">
      <div className="incoming-card">
        <div className="call-avatar big">{initials(who)}</div>
        <div className="incoming-name">{who}</div>
        <div className="incoming-sub">
          Incoming {invite.kind === "VIDEO" ? "video" : "voice"} call
        </div>
        <div className="incoming-actions">
          <button className="call-ctl hangup" onClick={decline} title="Decline">
            <Icon name="call_solid" size={26} />
          </button>
          <button className="call-ctl accept" onClick={accept} title="Accept">
            <Icon
              name={invite.kind === "VIDEO" ? "video_solid" : "call_solid"}
              size={26}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
