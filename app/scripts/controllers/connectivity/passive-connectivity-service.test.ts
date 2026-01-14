import { ConnectivityStatus } from '@metamask/connectivity-controller';

import { PassiveConnectivityService } from './passive-connectivity-service';

describe('PassiveConnectivityService', () => {
  let service: PassiveConnectivityService;

  beforeEach(() => {
    service = new PassiveConnectivityService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('getStatus', () => {
    it('returns online by default', () => {
      expect(service.getStatus()).toBe(ConnectivityStatus.Online);
    });

    it('returns offline after setStatus(offline)', () => {
      service.setStatus(ConnectivityStatus.Offline);
      expect(service.getStatus()).toBe(ConnectivityStatus.Offline);
    });

    it('returns online after setStatus(online)', () => {
      service.setStatus(ConnectivityStatus.Offline);
      service.setStatus(ConnectivityStatus.Online);
      expect(service.getStatus()).toBe(ConnectivityStatus.Online);
    });
  });

  describe('onConnectivityChange', () => {
    it('registers callback', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);

      // Callback should not be called until status changes
      expect(callback).not.toHaveBeenCalled();
    });

    it('calls callback when status changes to offline', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);

      service.setStatus(ConnectivityStatus.Offline);

      expect(callback).toHaveBeenCalledWith(ConnectivityStatus.Offline);
    });

    it('calls callback when status changes to online', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);
      service.setStatus(ConnectivityStatus.Offline);
      callback.mockClear();

      service.setStatus(ConnectivityStatus.Online);

      expect(callback).toHaveBeenCalledWith(ConnectivityStatus.Online);
    });

    it('calls callback even when status does not change (controller handles deduplication)', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);

      // Already online, setting to online again - still calls callback
      service.setStatus(ConnectivityStatus.Online);

      expect(callback).toHaveBeenCalledWith(ConnectivityStatus.Online);
    });

    it('calls all registered callbacks when status changes', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      service.onConnectivityChange(callback1);
      service.onConnectivityChange(callback2);
      service.onConnectivityChange(callback3);

      service.setStatus(ConnectivityStatus.Offline);

      expect(callback1).toHaveBeenCalledWith(ConnectivityStatus.Offline);
      expect(callback2).toHaveBeenCalledWith(ConnectivityStatus.Offline);
      expect(callback3).toHaveBeenCalledWith(ConnectivityStatus.Offline);
    });
  });

  describe('destroy', () => {
    it('stops calling callback after destroy', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);

      service.destroy();
      service.setStatus(ConnectivityStatus.Offline);

      expect(callback).not.toHaveBeenCalled();
    });

    it('can be called multiple times without error', () => {
      expect(() => {
        service.destroy();
        service.destroy();
      }).not.toThrow();
    });
  });
});
