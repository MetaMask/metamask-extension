import type { Patch } from 'immer';
import { StateSubscriptionService } from './state-subscription-service';

const makeKeyedState = () => ({
  PreferencesController: { theme: 'dark', locale: 'en' },
  NetworkController: { chainId: '0x1', selectedNetworkClientId: 'mainnet' },
});

describe('StateSubscriptionService', () => {
  describe('initialize', () => {
    it('creates proxies for all provided controllers', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      expect(service.hasProxy('PreferencesController')).toBe(true);
      expect(service.hasProxy('NetworkController')).toBe(true);
    });

    it('provides initial state via proxy getSnapshot', () => {
      const service = new StateSubscriptionService();
      const keyed = makeKeyedState();
      service.initialize(keyed);

      const proxy = service.getProxy('PreferencesController');
      expect(proxy.getSnapshot()).toEqual(keyed.PreferencesController);
    });

    it('clears previous proxies on re-initialization', () => {
      const service = new StateSubscriptionService();
      service.initialize({
        OldController: { value: 1 },
      });
      expect(service.hasProxy('OldController')).toBe(true);

      service.initialize(makeKeyedState());
      expect(service.hasProxy('OldController')).toBe(false);
    });
  });

  describe('reinitialize', () => {
    it('updates existing proxies in place', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const proxy = service.getProxy('PreferencesController');
      const listener = jest.fn();
      proxy.subscribe(listener);

      service.reinitialize({
        PreferencesController: { theme: 'light', locale: 'en' },
        NetworkController: { chainId: '0x5', selectedNetworkClientId: 'goerli' },
      });

      expect(proxy.getSnapshot()).toEqual({ theme: 'light', locale: 'en' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('creates new proxies for previously unregistered controllers', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      service.reinitialize({
        PreferencesController: { theme: 'dark', locale: 'en' },
        NewController: { data: [] },
      });

      expect(service.hasProxy('NewController')).toBe(true);
      expect(service.getProxy('NewController').getSnapshot()).toEqual({ data: [] });
    });

    it('automatically flushes after applying updates', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const listener = jest.fn();
      service.getProxy('PreferencesController').subscribe(listener);

      service.reinitialize({
        PreferencesController: { theme: 'light', locale: 'en' },
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProxy', () => {
    it('returns a typed proxy for a registered controller', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const proxy = service.getProxy('PreferencesController');
      expect(proxy).toBeDefined();
      expect(typeof proxy.getSnapshot).toBe('function');
      expect(typeof proxy.subscribe).toBe('function');
    });

    it('throws when requesting an unregistered controller', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      expect(() => service.getProxy('NonExistentController')).toThrow(
        /no proxy registered for controller "NonExistentController"/u,
      );
    });

    it('includes available controller names in the error message', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      expect(() => service.getProxy('Missing')).toThrow(
        /PreferencesController, NetworkController/u,
      );
    });
  });

  describe('hasProxy', () => {
    it('returns true for registered controllers', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());
      expect(service.hasProxy('PreferencesController')).toBe(true);
    });

    it('returns false for unregistered controllers', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());
      expect(service.hasProxy('Missing')).toBe(false);
    });
  });

  describe('applyBatch', () => {
    it('applies patches to the correct proxy', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const patches: Patch[] = [
        { op: 'replace', path: ['theme'], value: 'light' },
      ];
      service.applyBatch({ PreferencesController: patches });

      const snap = service.getProxy('PreferencesController').getSnapshot();
      expect(snap).toEqual({ theme: 'light', locale: 'en' });
    });

    it('applies direct state references', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const newState = { chainId: '0x5', selectedNetworkClientId: 'goerli' };
      service.applyBatch({ NetworkController: newState });

      expect(service.getProxy('NetworkController').getSnapshot()).toBe(newState);
    });

    it('handles mixed patches and direct state in a single batch', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const patches: Patch[] = [
        { op: 'replace', path: ['theme'], value: 'light' },
      ];
      const newNetworkState = { chainId: '0xa', selectedNetworkClientId: 'optimism' };

      service.applyBatch({
        PreferencesController: patches,
        NetworkController: newNetworkState,
      });

      expect(
        service.getProxy('PreferencesController').getSnapshot(),
      ).toEqual({ theme: 'light', locale: 'en' });
      expect(
        service.getProxy('NetworkController').getSnapshot(),
      ).toBe(newNetworkState);
    });

    it('does not notify subscribers (phase 1 only)', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const listener = jest.fn();
      service.getProxy('PreferencesController').subscribe(listener);

      service.applyBatch({
        PreferencesController: [
          { op: 'replace', path: ['theme'], value: 'light' },
        ],
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('skips unknown controllers gracefully', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      expect(() =>
        service.applyBatch({ UnknownController: { data: 42 } }),
      ).not.toThrow();
    });
  });

  describe('flush', () => {
    it('notifies subscribers of changed proxies', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const prefListener = jest.fn();
      const netListener = jest.fn();
      service.getProxy('PreferencesController').subscribe(prefListener);
      service.getProxy('NetworkController').subscribe(netListener);

      service.applyBatch({
        PreferencesController: [
          { op: 'replace', path: ['theme'], value: 'light' },
        ],
      });

      service.flush();

      expect(prefListener).toHaveBeenCalledTimes(1);
      expect(netListener).not.toHaveBeenCalled();
    });

    it('prevents torn reads across controllers', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const snapshots: Array<{ pref: unknown; net: unknown }> = [];
      const captureSnapshot = () => {
        snapshots.push({
          pref: service.getProxy('PreferencesController').getSnapshot(),
          net: service.getProxy('NetworkController').getSnapshot(),
        });
      };

      service.getProxy('PreferencesController').subscribe(captureSnapshot);

      const newNetworkState = { chainId: '0xa', selectedNetworkClientId: 'optimism' };
      service.applyBatch({
        PreferencesController: [
          { op: 'replace', path: ['theme'], value: 'light' },
        ],
        NetworkController: newNetworkState,
      });

      service.flush();

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].pref).toEqual({ theme: 'light', locale: 'en' });
      expect(snapshots[0].net).toBe(newNetworkState);
    });

    it('is a no-op when no proxies are dirty', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      const listener = jest.fn();
      service.getProxy('PreferencesController').subscribe(listener);

      service.flush();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getAllSnapshots', () => {
    it('returns all controller state snapshots', () => {
      const service = new StateSubscriptionService();
      const keyed = makeKeyedState();
      service.initialize(keyed);

      expect(service.getAllSnapshots()).toEqual(keyed);
    });

    it('reflects applied patches after flush', () => {
      const service = new StateSubscriptionService();
      service.initialize(makeKeyedState());

      service.applyBatch({
        PreferencesController: [
          { op: 'replace', path: ['theme'], value: 'light' },
        ],
      });
      service.flush();

      const all = service.getAllSnapshots();
      expect(all.PreferencesController).toEqual({ theme: 'light', locale: 'en' });
      expect(all.NetworkController).toEqual({
        chainId: '0x1',
        selectedNetworkClientId: 'mainnet',
      });
    });
  });
});
