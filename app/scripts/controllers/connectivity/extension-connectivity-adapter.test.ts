import { CONNECTIVITY_STATUSES } from '@metamask/connectivity-controller';

import { ExtensionConnectivityAdapter } from './extension-connectivity-adapter';

describe('ExtensionConnectivityAdapter', () => {
  let adapter: ExtensionConnectivityAdapter;

  beforeEach(() => {
    adapter = new ExtensionConnectivityAdapter();
  });

  afterEach(() => {
    adapter.destroy();
  });

  describe('getStatus', () => {
    it('returns online by default', () => {
      expect(adapter.getStatus()).toBe(CONNECTIVITY_STATUSES.Online);
    });

    it('returns offline after setStatus(offline)', () => {
      adapter.setStatus(CONNECTIVITY_STATUSES.Offline);
      expect(adapter.getStatus()).toBe(CONNECTIVITY_STATUSES.Offline);
    });

    it('returns online after setStatus(online)', () => {
      adapter.setStatus(CONNECTIVITY_STATUSES.Offline);
      adapter.setStatus(CONNECTIVITY_STATUSES.Online);
      expect(adapter.getStatus()).toBe(CONNECTIVITY_STATUSES.Online);
    });
  });

  describe('onConnectivityChange', () => {
    it('registers callback', () => {
      const callback = jest.fn();
      adapter.onConnectivityChange(callback);

      // Callback should not be called until status changes
      expect(callback).not.toHaveBeenCalled();
    });

    it('calls callback when status changes to offline', () => {
      const callback = jest.fn();
      adapter.onConnectivityChange(callback);

      adapter.setStatus(CONNECTIVITY_STATUSES.Offline);

      expect(callback).toHaveBeenCalledWith(CONNECTIVITY_STATUSES.Offline);
    });

    it('calls callback when status changes to online', () => {
      const callback = jest.fn();
      adapter.onConnectivityChange(callback);
      adapter.setStatus(CONNECTIVITY_STATUSES.Offline);
      callback.mockClear();

      adapter.setStatus(CONNECTIVITY_STATUSES.Online);

      expect(callback).toHaveBeenCalledWith(CONNECTIVITY_STATUSES.Online);
    });

    it('calls callback even when status does not change (controller handles deduplication)', () => {
      const callback = jest.fn();
      adapter.onConnectivityChange(callback);

      // Already online, setting to online again - still calls callback
      adapter.setStatus(CONNECTIVITY_STATUSES.Online);

      expect(callback).toHaveBeenCalledWith(CONNECTIVITY_STATUSES.Online);
    });

    it('calls all registered callbacks when status changes', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      adapter.onConnectivityChange(callback1);
      adapter.onConnectivityChange(callback2);
      adapter.onConnectivityChange(callback3);

      adapter.setStatus(CONNECTIVITY_STATUSES.Offline);

      expect(callback1).toHaveBeenCalledWith(CONNECTIVITY_STATUSES.Offline);
      expect(callback2).toHaveBeenCalledWith(CONNECTIVITY_STATUSES.Offline);
      expect(callback3).toHaveBeenCalledWith(CONNECTIVITY_STATUSES.Offline);
    });
  });

  describe('destroy', () => {
    it('stops calling callback after destroy', () => {
      const callback = jest.fn();
      adapter.onConnectivityChange(callback);

      adapter.destroy();
      adapter.setStatus(CONNECTIVITY_STATUSES.Offline);

      expect(callback).not.toHaveBeenCalled();
    });

    it('can be called multiple times without error', () => {
      expect(() => {
        adapter.destroy();
        adapter.destroy();
      }).not.toThrow();
    });
  });
});
