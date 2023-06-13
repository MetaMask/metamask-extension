import { CHAIN_IDS } from '../../../shared/constants/network';
import CachedBalancesController from './cached-balances';

describe('CachedBalancesController', () => {
  describe('updateCachedBalances', () => {
    it('should update the cached balances', async () => {
      const controller = new CachedBalancesController({
        getCurrentChainId: () => CHAIN_IDS.GOERLI,
        accountTracker: {
          store: {
            subscribe: () => undefined,
          },
        },
        initState: {
          cachedBalances: 'mockCachedBalances',
        },
      });

      jest
        .spyOn(controller, '_generateBalancesToCache')
        .mockResolvedValue('mockNewCachedBalances');

      await controller.updateCachedBalances({ accounts: 'mockAccounts' });

      expect(controller._generateBalancesToCache).toHaveBeenCalledWith(
        'mockAccounts',
        CHAIN_IDS.GOERLI,
      );
      expect(controller.store.getState().cachedBalances).toStrictEqual(
        'mockNewCachedBalances',
      );
    });
  });

  describe('_generateBalancesToCache', () => {
    it('should generate updated account balances where the current network was updated', () => {
      const controller = new CachedBalancesController({
        accountTracker: {
          store: {
            subscribe: () => undefined,
          },
        },
        initState: {
          cachedBalances: {
            [CHAIN_IDS.GOERLI]: {
              a: '0x1',
              b: '0x2',
              c: '0x3',
            },
            16: {
              a: '0xa',
              b: '0xb',
              c: '0xc',
            },
          },
        },
      });

      const result = controller._generateBalancesToCache(
        {
          a: { balance: '0x4' },
          b: { balance: null },
          c: { balance: '0x5' },
        },
        CHAIN_IDS.GOERLI,
      );

      expect(result).toStrictEqual({
        [CHAIN_IDS.GOERLI]: {
          a: '0x4',
          b: '0x2',
          c: '0x5',
        },
        16: {
          a: '0xa',
          b: '0xb',
          c: '0xc',
        },
      });
    });

    it('should generate updated account balances where the a new network was selected', () => {
      const controller = new CachedBalancesController({
        accountTracker: {
          store: {
            subscribe: () => undefined,
          },
        },
        initState: {
          cachedBalances: {
            [CHAIN_IDS.GOERLI]: {
              a: '0x1',
              b: '0x2',
              c: '0x3',
            },
          },
        },
      });

      const result = controller._generateBalancesToCache(
        {
          a: { balance: '0x4' },
          b: { balance: null },
          c: { balance: '0x5' },
        },
        16,
      );

      expect(result).toStrictEqual({
        [CHAIN_IDS.GOERLI]: {
          a: '0x1',
          b: '0x2',
          c: '0x3',
        },
        16: {
          a: '0x4',
          c: '0x5',
        },
      });
    });
  });

  describe('_registerUpdates', () => {
    it('should subscribe to the account tracker with the updateCachedBalances method', async () => {
      const subscribeSpy = jest.fn();
      const controller = new CachedBalancesController({
        getCurrentChainId: () => CHAIN_IDS.GOERLI,
        accountTracker: {
          store: {
            subscribe: subscribeSpy,
          },
        },
      });

      subscribeSpy.mockReset();

      const updateCachedBalancesSpy = jest.fn();
      controller.updateCachedBalances = updateCachedBalancesSpy;
      controller._registerUpdates({ accounts: 'mockAccounts' });

      expect(subscribeSpy).toHaveBeenCalled();
      subscribeSpy.mock.calls[0][0]();
      expect(updateCachedBalancesSpy).toHaveBeenCalled();
    });
  });
});
