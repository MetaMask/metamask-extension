import { it } from '@jest/globals';
import {
  BrazeAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import {
  createOffscreenBrazeClient,
  type BrazeSyncUserMessage,
} from './braze-client';

const message = (profileId: string | null): BrazeSyncUserMessage => ({
  target: OffscreenCommunicationTarget.brazeOffscreen,
  action: BrazeAction.syncUser,
  profileId,
});

describe('createOffscreenBrazeClient', () => {
  it('waits for the offscreen document before sending', async () => {
    let resolveReady: () => void = () => undefined;
    const offscreenReady = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    const sendMessage = jest.fn().mockResolvedValue({ success: true });
    const syncUser = createOffscreenBrazeClient(offscreenReady, sendMessage);

    const sync = syncUser('canonical-123');
    await Promise.resolve();

    expect(sendMessage).not.toHaveBeenCalled();

    resolveReady();
    await sync;

    expect(sendMessage).toHaveBeenCalledWith(message('canonical-123'));
  });

  it('sends a clear request', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: true });
    const syncUser = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

    await syncUser(null);

    expect(sendMessage).toHaveBeenCalledWith(message(null));
  });

  it('resolves when the offscreen document applies the user', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: true });
    const syncUser = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

    await expect(syncUser('canonical-123')).resolves.toBeUndefined();
  });

  it('throws when the offscreen document reports a failure', async () => {
    const sendMessage = jest.fn().mockResolvedValue({
      success: false,
      error: 'SDK unavailable',
    });
    const syncUser = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

    await expect(syncUser('canonical-123')).rejects.toThrow(
      'Braze user sync failed: SDK unavailable',
    );
  });

  it('throws when the offscreen document does not respond', async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const syncUser = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

    await expect(syncUser('canonical-123')).rejects.toThrow(
      'Braze user sync failed: no response from the offscreen document',
    );
  });

  it('sends through the extension runtime by default', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: true });
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: { runtime: { sendMessage } },
    });
    const syncUser = createOffscreenBrazeClient(Promise.resolve());

    await syncUser('canonical-123');

    expect(sendMessage).toHaveBeenCalledWith(message('canonical-123'));
  });
});
