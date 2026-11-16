import { it } from '@jest/globals';
import {
  BrazeAction,
  OffscreenCommunicationTarget,
  type BrazeMessage,
} from '../../shared/constants/offscreen-communication';
import type { BrazeBanner } from '../../shared/lib/braze';
import { createOffscreenBrazeClient } from './braze-client';

const PLACEMENT_ID = 'extension-wallet-home';

const syncUserMessage = (profileId: string | null): BrazeMessage => ({
  target: OffscreenCommunicationTarget.brazeOffscreen,
  action: BrazeAction.syncUser,
  profileId,
});

const banner: BrazeBanner = {
  id: 'banner-1',
  placementId: PLACEMENT_ID,
  isControl: false,
  title: null,
  body: 'Explore your wallet',
  imageUrl: null,
  ctaLabel: null,
  deeplink: null,
};

describe('createOffscreenBrazeClient', () => {
  it('waits for the offscreen document before sending', async () => {
    let resolveReady: () => void = () => undefined;
    const offscreenReady = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    const sendMessage = jest.fn().mockResolvedValue({ success: true });
    const client = createOffscreenBrazeClient(offscreenReady, sendMessage);

    const sync = client.syncUser('canonical-123');
    await Promise.resolve();

    expect(sendMessage).not.toHaveBeenCalled();

    resolveReady();
    await sync;

    expect(sendMessage).toHaveBeenCalledWith(syncUserMessage('canonical-123'));
  });

  describe('syncUser', () => {
    it('sends a clear request', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ success: true });
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      await client.syncUser(null);

      expect(sendMessage).toHaveBeenCalledWith(syncUserMessage(null));
    });

    it('resolves when the offscreen document applies the user', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ success: true });
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      await expect(client.syncUser('canonical-123')).resolves.toBeUndefined();
    });

    it('throws when the offscreen document reports a failure', async () => {
      const sendMessage = jest.fn().mockResolvedValue({
        success: false,
        error: 'SDK unavailable',
      });
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      await expect(client.syncUser('canonical-123')).rejects.toThrow(
        'Braze offscreen request braze-sync-user failed: SDK unavailable',
      );
    });

    it('throws when the offscreen document does not respond', async () => {
      const sendMessage = jest.fn().mockResolvedValue(undefined);
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      await expect(client.syncUser('canonical-123')).rejects.toThrow(
        'Braze offscreen request braze-sync-user failed: no response from the offscreen document',
      );
    });
  });

  describe('getBanner', () => {
    it('returns the banner from the offscreen document', async () => {
      const sendMessage = jest
        .fn()
        .mockResolvedValue({ success: true, banner });
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      expect(await client.getBanner(PLACEMENT_ID)).toStrictEqual(banner);
      expect(sendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.brazeOffscreen,
        action: BrazeAction.getBanner,
        placementId: PLACEMENT_ID,
      });
    });

    it('returns null when there is no banner', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ success: true });
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      expect(await client.getBanner(PLACEMENT_ID)).toBeNull();
    });

    it('throws when the offscreen document reports a failure', async () => {
      const sendMessage = jest
        .fn()
        .mockResolvedValue({ success: false, error: 'SDK unavailable' });
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      await expect(client.getBanner(PLACEMENT_ID)).rejects.toThrow(
        'Braze offscreen request braze-get-banner failed: SDK unavailable',
      );
    });
  });

  describe('logBannerInteraction', () => {
    it('sends the interaction', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ success: true });
      const client = createOffscreenBrazeClient(Promise.resolve(), sendMessage);

      await client.logBannerInteraction(PLACEMENT_ID, 'banner-1', 'dismiss');

      expect(sendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.brazeOffscreen,
        action: BrazeAction.logBannerInteraction,
        placementId: PLACEMENT_ID,
        bannerId: 'banner-1',
        interaction: 'dismiss',
      });
    });
  });

  it('sends through the extension runtime by default', async () => {
    const sendMessage = jest.fn().mockResolvedValue({ success: true });
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: { runtime: { sendMessage } },
    });
    const client = createOffscreenBrazeClient(Promise.resolve());

    await client.syncUser('canonical-123');

    expect(sendMessage).toHaveBeenCalledWith(syncUserMessage('canonical-123'));
  });
});
