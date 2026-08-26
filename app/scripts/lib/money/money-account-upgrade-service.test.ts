import type { MoneyAccountUpgradeController } from '@metamask/money-account-upgrade-controller';
import type { Hex } from '@metamask/utils';
import { captureException } from '../../../../shared/lib/sentry';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import {
  MoneyAccountUpgradeService,
  type MoneyAccountUpgradeServiceMessenger,
} from './money-account-upgrade-service';
import { upgradeAccountWithRetry } from './upgrade-account-with-retry';

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));
jest.mock('./get-money-account-address');
jest.mock('./upgrade-account-with-retry');

const MONEY_ADDRESS = '0xD5FE9B0579443E7025Cf3309Ba420977710e7183' as Hex;
const MONEY_ADDRESS_LOWERCASED = MONEY_ADDRESS.toLowerCase() as Lowercase<Hex>;

const NOT_BOOTSTRAPPED_ERROR = new Error(
  'MoneyAccountUpgradeController is not bootstrapped: upgradeAccount() requires the feature flag on, the wallet unlocked, and a successful bootstrap',
);

/**
 * Flush the microtask queue so a triggered run settles.
 */
const flushPromises = async () => {
  await new Promise(process.nextTick);
};

function createService() {
  const messenger = {
    call: jest.fn(),
    registerMethodActionHandlers: jest.fn(),
  } as unknown as MoneyAccountUpgradeServiceMessenger;

  const sync = jest.fn();
  const upgradeAccount = jest.fn().mockResolvedValue(undefined);
  const upgradeController = {
    sync,
    upgradeAccount,
  } as unknown as MoneyAccountUpgradeController;

  const service = new MoneyAccountUpgradeService({
    messenger,
    upgradeController,
  });

  return { service, messenger, sync, upgradeAccount };
}

describe('MoneyAccountUpgradeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(deriveMoneyAccountAddress).mockResolvedValue(MONEY_ADDRESS);
    jest
      .mocked(upgradeAccountWithRetry)
      .mockImplementation(async (upgradeAccount, address) => {
        await upgradeAccount(address);
      });
  });

  it('registers the trigger as a method action', () => {
    const { service, messenger } = createService();

    expect(messenger.registerMethodActionHandlers).toHaveBeenCalledWith(
      service,
      ['triggerUpgrade'],
    );
  });

  describe('triggerUpgrade', () => {
    it('upgrades the derived address, lowercased', async () => {
      const { service, upgradeAccount } = createService();

      service.triggerUpgrade();
      await flushPromises();

      expect(upgradeAccount).toHaveBeenCalledWith(MONEY_ADDRESS_LOWERCASED);
    });

    it('re-syncs the controller bootstrap before upgrading', async () => {
      const { service, sync, upgradeAccount } = createService();

      service.triggerUpgrade();
      await flushPromises();

      expect(sync).toHaveBeenCalledTimes(1);
      expect(sync.mock.invocationCallOrder[0]).toBeLessThan(
        upgradeAccount.mock.invocationCallOrder[0],
      );
    });

    it('skips when the address cannot be derived', async () => {
      jest
        .mocked(deriveMoneyAccountAddress)
        .mockRejectedValue(new Error('locked'));
      const { service, upgradeAccount } = createService();

      service.triggerUpgrade();
      await flushPromises();

      expect(upgradeAccount).not.toHaveBeenCalled();
      expect(jest.mocked(captureException)).not.toHaveBeenCalled();
    });

    it('skips without reporting when the controller is not bootstrapped', async () => {
      jest
        .mocked(upgradeAccountWithRetry)
        .mockRejectedValueOnce(NOT_BOOTSTRAPPED_ERROR)
        .mockResolvedValueOnce(undefined);
      const { service } = createService();

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(captureException)).not.toHaveBeenCalled();

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(upgradeAccountWithRetry)).toHaveBeenCalledTimes(2);
    });

    it('dedupes triggers while a run is in flight', async () => {
      let resolveRun: () => void = () => undefined;
      jest.mocked(upgradeAccountWithRetry).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveRun = resolve;
          }),
      );
      const { service } = createService();

      service.triggerUpgrade();
      await flushPromises();
      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(upgradeAccountWithRetry)).toHaveBeenCalledTimes(1);

      resolveRun();
      await flushPromises();
      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(upgradeAccountWithRetry)).toHaveBeenCalledTimes(2);
    });

    it('reports a failed run to Sentry and re-arms the next trigger', async () => {
      const error = new Error('terminal');
      jest
        .mocked(upgradeAccountWithRetry)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);
      const { service } = createService();

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(captureException)).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.objectContaining({ feature: 'money-account-upgrade' }),
        }),
      );

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(upgradeAccountWithRetry)).toHaveBeenCalledTimes(2);
    });

    it('caps retried-failure reports at three per run', async () => {
      const retryError = new Error('transient');
      jest
        .mocked(upgradeAccountWithRetry)
        .mockImplementation(async (_upgradeAccount, _address, options) => {
          for (let attempt = 1; attempt <= 5; attempt++) {
            options?.onRetry?.(retryError, attempt);
          }
        });
      const { service } = createService();

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(captureException)).toHaveBeenCalledTimes(3);
    });
  });
});
