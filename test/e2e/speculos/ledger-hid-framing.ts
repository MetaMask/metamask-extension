// Transitive dependency of @ledgerhq/hw-transport-webhid (Ledger HID protocol)
// eslint-disable-next-line import-x/no-extraneous-dependencies -- used only in E2E ApduBridge
import createHIDframing from '@ledgerhq/devices/lib/hid-framing';
import type { ResponseAcc } from '@ledgerhq/devices/lib/hid-framing';

const PACKET_SIZE = 64;

export type LedgerHidFramingSession = {
  channel: number;
  framing: ReturnType<typeof createHIDframing>;
  acc: ResponseAcc;
};

/**
 * Create a framing session from the first HID frame (reads channel from header).
 * @param firstFrame
 */
export function createLedgerHidFramingSession(
  firstFrame: Buffer,
): LedgerHidFramingSession {
  const channel = firstFrame.readUInt16BE(0);
  return {
    channel,
    framing: createHIDframing(channel, PACKET_SIZE),
    acc: null,
  };
}

/**
 * Push an incoming HID frame; returns complete raw APDU when the message is complete.
 * @param session
 * @param frame
 */
export function pushLedgerHidFrame(
  session: LedgerHidFramingSession,
  frame: Buffer,
): Buffer | null {
  try {
    session.acc = session.framing.reduceResponse(session.acc, frame);
    const result = session.framing.getReducedResult(session.acc);
    if (result) {
      session.acc = null;
      return result;
    }
    return null;
  } catch (error) {
    const id =
      error && typeof error === 'object' && 'id' in error
        ? String((error as { id: string }).id)
        : '';
    if (id === 'InvalidChannel') {
      return null;
    }
    throw error;
  }
}

/**
 * Encode a raw Speculos APDU response into HID frames for the transport.
 * @param session
 * @param apduResponse
 */
export function encodeLedgerHidResponse(
  session: LedgerHidFramingSession,
  apduResponse: Buffer,
): Buffer[] {
  return session.framing.makeBlocks(apduResponse);
}
