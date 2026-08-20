import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  MoneyAccountController,
  type MoneyAccountControllerMessenger,
  type MoneyAccountControllerState,
} from '@metamask/money-account-controller';
import type {
  KeyringControllerGetStateAction,
  KeyringControllerState,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import type {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerState,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../shared/lib/money/feature-flags';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getMoneyAccountControllerInitMessenger,
  getMoneyAccountControllerMessenger,
  type MoneyAccountControllerInitMessenger,
} from './messengers/money-account-controller-messenger';
import { MoneyAccountControllerInit } from './money-account-controller-init';
import type { MessengerClientInitRequest } from './types';

jest.mock('@metamask/money-account-controller');

const PRIMARY_ENTROPY_SOURCE = 'primary-hd-keyring-id';

/**
 * Build a money account for an entropy source.
 *
 * @param entropySource - The entropy source the account belongs to.
 * @returns The money account.
 */
const moneyAccountFor = (entropySource: string) =>
  ({
    id: `money-account-${entropySource}`,
    address: '0xd5fe9b0579443e7025cf3309ba420977710e7183',
    options: { entropy: { id: entropySource } },
  }) as unknown as MoneyAccountControllerState['moneyAccounts'][string];

type BaseMessenger = Messenger<
  MockAnyNamespace,
  | ActionConstraint
  | KeyringControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction,
  KeyringControllerUnlockEvent | RemoteFeatureFlagControllerStateChangeEvent
>;

/**
 * Build a base messenger with the flag and lock state the init function reads.
 *
 * @param options - Options.
 * @param options.isEnabled - Whether the Money Account feature flag is on.
 * @param options.isUnlocked - Whether the wallet is unlocked.
 * @returns The base messenger.
 */
function buildBaseMessenger({
  isEnabled = true,
  isUnlocked = true,
}: { isEnabled?: boolean; isUnlocked?: boolean } = {}): BaseMessenger {
  const messenger: BaseMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  messenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags: {
          [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
            enabled: isEnabled,
            minimumVersion: '0.0.1',
          },
        },
        cacheTimestamp: Date.now(),
      }) as unknown as RemoteFeatureFlagControllerState,
  );

  messenger.registerActionHandler(
    'KeyringController:getState',
    () => ({ isUnlocked, keyrings: [] }) as KeyringControllerState,
  );

  return messenger;
}

/**
 * Build the init request for the given base messenger.
 *
 * @param baseMessenger - The base messenger.
 * @returns The init request.
 */
function getInitRequestMock(
  baseMessenger: BaseMessenger,
): jest.Mocked<
  MessengerClientInitRequest<
    MoneyAccountControllerMessenger,
    MoneyAccountControllerInitMessenger
  >
> {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMoneyAccountControllerMessenger(baseMessenger),
    initMessenger: getMoneyAccountControllerInitMessenger(baseMessenger),
  };
}

/**
 * Publish a remote feature flag state change.
 *
 * @param messenger - The base messenger.
 */
function publishFlagChange(messenger: BaseMessenger) {
  messenger.publish(
    'RemoteFeatureFlagController:stateChange',
    {} as RemoteFeatureFlagControllerState,
    [],
  );
}

/**
 * Publish an unlock.
 *
 * @param messenger - The base messenger.
 */
function publishUnlock(messenger: BaseMessenger) {
  messenger.publish('KeyringController:unlock');
}

describe('MoneyAccountControllerInit', () => {
  let state: MoneyAccountControllerState;
  let primaryEntropySource: string;
  let init: jest.Mock;
  let clearState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    state = { moneyAccounts: {} };
    primaryEntropySource = PRIMARY_ENTROPY_SOURCE;

    // The real `init` creates the keyring and records the account, so the stub
    // does the state half of that — the flow under test reads it back to decide
    // whether there is anything left to do.
    init = jest.fn(() => {
      const account = moneyAccountFor(primaryEntropySource);
      state.moneyAccounts[account.id] = account;
      return Promise.resolve();
    });
    clearState = jest.fn(() => {
      state.moneyAccounts = {};
    });
    // Matches the real controller: the account is looked up by the primary
    // entropy source, not by "is there any account at all".
    const getMoneyAccount = jest.fn(() =>
      Object.values(state.moneyAccounts).find(
        (account) => account.options.entropy.id === primaryEntropySource,
      ),
    );

    jest.mocked(MoneyAccountController).mockImplementation(
      () =>
        ({
          get state() {
            return state;
          },
          init,
          clearState,
          getMoneyAccount,
        }) as unknown as MoneyAccountController,
    );
  });

  it('initializes the controller with its messenger and persisted state', () => {
    const request = getInitRequestMock(buildBaseMessenger());
    request.persistedState = { MoneyAccountController: { moneyAccounts: {} } };

    const { messengerClient } = MoneyAccountControllerInit(request);

    expect(messengerClient).toBe(
      jest.mocked(MoneyAccountController).mock.results[0].value,
    );
    expect(jest.mocked(MoneyAccountController)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: { moneyAccounts: {} },
    });
  });

  it('persists its state, so the account survives a restart', () => {
    const result = MoneyAccountControllerInit(
      getInitRequestMock(buildBaseMessenger()),
    );

    // Both undefined means "use the controller name", i.e. persisted and
    // mirrored to the UI — unlike the money services, which opt out of both.
    expect(result.persistedStateKey).toBeUndefined();
    expect(result.memStateKey).toBeUndefined();
  });

  it('does not create the account at construction time', () => {
    MoneyAccountControllerInit(getInitRequestMock(buildBaseMessenger()));

    expect(init).not.toHaveBeenCalled();
  });

  it('creates the account when the remote flags arrive', async () => {
    const messenger = buildBaseMessenger();
    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishFlagChange(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('creates the account on unlock', async () => {
    const messenger = buildBaseMessenger();
    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishUnlock(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('does not create the account while the wallet is locked', async () => {
    const messenger = buildBaseMessenger({ isUnlocked: false });
    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishFlagChange(messenger);
    await Promise.resolve();

    // The controller cannot reach the seed while locked, and throws if asked.
    expect(init).not.toHaveBeenCalled();
  });

  it('does not create the account when the feature flag is off', async () => {
    const messenger = buildBaseMessenger({ isEnabled: false });
    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishFlagChange(messenger);
    publishUnlock(messenger);
    await Promise.resolve();

    expect(init).not.toHaveBeenCalled();
    expect(clearState).not.toHaveBeenCalled();
  });

  it('does not create a second account once one exists', async () => {
    const messenger = buildBaseMessenger();
    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishFlagChange(messenger);
    await Promise.resolve();
    publishUnlock(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('creates a fresh account after a vault restore, when the recorded one belongs to a previous seed', async () => {
    const messenger = buildBaseMessenger();
    state.moneyAccounts = { old: moneyAccountFor('a-previous-seed') };

    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishUnlock(messenger);
    await Promise.resolve();

    // Counting entries would have found one and skipped, leaving the restored
    // wallet permanently without a money account.
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('clears its state when the flag is turned off after an account was created', async () => {
    let isEnabled = true;
    const messenger: BaseMessenger = new Messenger({
      namespace: MOCK_ANY_NAMESPACE,
    });
    messenger.registerActionHandler(
      'RemoteFeatureFlagController:getState',
      () =>
        ({
          remoteFeatureFlags: {
            [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
              enabled: isEnabled,
              minimumVersion: '0.0.1',
            },
          },
        }) as unknown as RemoteFeatureFlagControllerState,
    );
    messenger.registerActionHandler(
      'KeyringController:getState',
      () => ({ isUnlocked: true, keyrings: [] }) as KeyringControllerState,
    );

    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishFlagChange(messenger);
    await Promise.resolve();
    expect(init).toHaveBeenCalledTimes(1);

    isEnabled = false;
    publishFlagChange(messenger);
    await Promise.resolve();

    expect(clearState).toHaveBeenCalledTimes(1);
  });

  it('swallows a creation failure, leaving the next trigger to retry', async () => {
    const messenger = buildBaseMessenger();
    init.mockRejectedValue(new Error('vault is busy'));

    MoneyAccountControllerInit(getInitRequestMock(messenger));

    expect(() => publishFlagChange(messenger)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    publishUnlock(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(2);
  });
});
