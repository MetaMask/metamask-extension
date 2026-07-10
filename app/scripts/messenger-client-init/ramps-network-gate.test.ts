import type { RampsController } from '@metamask/ramps-controller';
import {
  RAMPS_NETWORK_ACCESS_DENIED_MESSAGE,
  applyRampsNetworkGate,
  assertRampsNetworkAllowed,
  wrapRampsNetworkMethod,
} from './ramps-network-gate';

describe('ramps-network-gate', () => {
  describe('assertRampsNetworkAllowed', () => {
    it('throws when network access is denied', () => {
      expect(() => assertRampsNetworkAllowed(false)).toThrow(
        RAMPS_NETWORK_ACCESS_DENIED_MESSAGE,
      );
    });

    it('does not throw when network access is allowed', () => {
      expect(() => assertRampsNetworkAllowed(true)).not.toThrow();
    });
  });

  describe('wrapRampsNetworkMethod', () => {
    it('invokes the underlying method when allowed', () => {
      const method = jest.fn().mockReturnValue('ok');
      const wrapped = wrapRampsNetworkMethod(method, () => true);

      expect(wrapped('arg')).toBe('ok');
      expect(method).toHaveBeenCalledWith('arg');
    });

    it('throws before invoking the underlying method when denied', () => {
      const method = jest.fn();
      const wrapped = wrapRampsNetworkMethod(method, () => false);

      expect(() => wrapped()).toThrow(RAMPS_NETWORK_ACCESS_DENIED_MESSAGE);
      expect(method).not.toHaveBeenCalled();
    });
  });

  describe('applyRampsNetworkGate', () => {
    it('wraps network methods on the controller instance', () => {
      const getQuotes = jest.fn();
      const controller = {
        init: jest.fn(),
        getCountries: jest.fn(),
        getTokens: jest.fn(),
        getProviders: jest.fn(),
        getPaymentMethods: jest.fn(),
        getQuotes,
        getBuyWidgetData: jest.fn(),
        addPrecreatedOrder: jest.fn(),
        addOrder: jest.fn(),
        getOrder: jest.fn(),
        getOrderFromCallback: jest.fn(),
      } as unknown as RampsController;

      applyRampsNetworkGate(controller, () => false);

      expect(() =>
        controller.getQuotes({ amount: 0, walletAddress: '0x0' }),
      ).toThrow(RAMPS_NETWORK_ACCESS_DENIED_MESSAGE);
      expect(getQuotes).not.toHaveBeenCalled();
    });
  });
});
