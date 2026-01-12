import { PassiveConnectivityService } from './passive-connectivity-service';

describe('PassiveConnectivityService', () => {
  let service: PassiveConnectivityService;

  beforeEach(() => {
    service = new PassiveConnectivityService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('isOnline', () => {
    it('returns true by default', () => {
      expect(service.isOnline()).toBe(true);
    });

    it('returns false after setStatus(false)', () => {
      service.setStatus(false);
      expect(service.isOnline()).toBe(false);
    });

    it('returns true after setStatus(true)', () => {
      service.setStatus(false);
      service.setStatus(true);
      expect(service.isOnline()).toBe(true);
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

      service.setStatus(false);

      expect(callback).toHaveBeenCalledWith(false);
    });

    it('calls callback when status changes to online', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);
      service.setStatus(false);
      callback.mockClear();

      service.setStatus(true);

      expect(callback).toHaveBeenCalledWith(true);
    });

    it('calls callback even when status does not change (controller handles deduplication)', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);

      // Already online, setting to online again - still calls callback
      service.setStatus(true);

      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  describe('destroy', () => {
    it('stops calling callback after destroy', () => {
      const callback = jest.fn();
      service.onConnectivityChange(callback);

      service.destroy();
      service.setStatus(false);

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
