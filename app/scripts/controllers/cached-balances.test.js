import { strict as assert } from 'assert';
import sinon from 'sinon';
import { KOVAN_CHAIN_ID } from '../../../shared/constants/network';
import CachedBalancesController from './cached-balances';

describe('CachedBalancesController', function () {
  describe('updateCachedBalances', function () {
    it('should update the cached balances', async function () {
      const controller = new CachedBalancesController({
        getCurrentChainId: () => KOVAN_CHAIN_ID,
        accountTracker: {
          store: {
            subscribe: () => undefined,
          },
        },
        initState: {
          cachedBalances: 'mockCachedBalances',
        },
      });

      controller._generateBalancesToCache = sinon
        .stub()
        .callsFake(() => Promise.resolve('mockNewCachedBalances'));

      await controller.updateCachedBalances({ accounts: 'mockAccounts' });

      assert.equal(controller._generateBalancesToCache.callCount, 1);
      assert.deepEqual(controller._generateBalancesToCache.args[0], [
        'mockAccounts',
        KOVAN_CHAIN_ID,
      ]);
      assert.equal(
        controller.store.getState().cachedBalances,
        'mockNewCachedBalances',
      );
    });
  });

  describe('_generateBalancesToCache', function () {
    it('should generate updated account balances where the current network was updated', function () {
      const controller = new CachedBalancesController({
        accountTracker: {
          store: {
            subscribe: () => undefined,
          },
        },
        initState: {
          cachedBalances: {
            [KOVAN_CHAIN_ID]: {
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
        KOVAN_CHAIN_ID,
      );

      assert.deepEqual(result, {
        [KOVAN_CHAIN_ID]: {
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

    it('should generate updated account balances where the a new network was selected', function () {
      const controller = new CachedBalancesController({
        accountTracker: {
          store: {
            subscribe: () => undefined,
          },
        },
        initState: {
          cachedBalances: {
            [KOVAN_CHAIN_ID]: {
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

      assert.deepEqual(result, {
        [KOVAN_CHAIN_ID]: {
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

  describe('_registerUpdates', function () {
    it('should subscribe to the account tracker with the updateCachedBalances method', async function () {
      const subscribeSpy = sinon.spy();
      const controller = new CachedBalancesController({
        getCurrentChainId: () => KOVAN_CHAIN_ID,
        accountTracker: {
          store: {
            subscribe: subscribeSpy,
          },
        },
      });
      subscribeSpy.resetHistory();

      const updateCachedBalancesSpy = sinon.spy();
      controller.updateCachedBalances = updateCachedBalancesSpy;
      controller._registerUpdates({ accounts: 'mockAccounts' });

      assert.equal(subscribeSpy.callCount, 1);

      subscribeSpy.args[0][0]();

      assert.equal(updateCachedBalancesSpy.callCount, 1);
    });
  });
});
