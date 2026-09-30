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
  KeyringControllerStateChangeEvent,
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
  | KeyringControllerStateChangeEvent
  | RemoteFeatureFlagControllerStateChangeEvent
>;

/**
 * Build a base messenger with the flag and keyring state the init function
 * reads. The returned `config` is read live by the action handlers, so tests
 * can flip any value between triggers.
 *
 * @param options - Options.
 * @param options.isEnabled - Whether the Money Account feature flag is on.
 * @param options.isUnlocked - Whether the wallet is unlocked.
 * @param options.keyringIds - The metadata ids of the HD keyrings in the
 * vault. Defaults to just the primary; pass `[]` to model the mid-restore
 * window where the wallet is unlocked but the keyring list is still empty.
 * @returns The base messenger and its mutable config.
 */
function buildBaseMessenger({
  isEnabled = true,
  isUnlocked = true,
  keyringIds = [PRIMARY_ENTROPY_SOURCE],
}: {
  isEnabled?: boolean;
  isUnlocked?: boolean;
  keyringIds?: string[];
} = {}): {
  messenger: BaseMessenger;
  config: { isEnabled: boolean; isUnlocked: boolean; keyringIds: string[] };
} {
  const config = { isEnabled, isUnlocked, keyringIds };
  const messenger: BaseMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  messenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () =>
      ({
        remoteFeatureFlags: {
          [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
            enabled: config.isEnabled,
            minimumVersion: '0.0.1',
          },
        },
        cacheTimestamp: Date.now(),
      }) as unknown as RemoteFeatureFlagControllerState,
  );

  messenger.registerActionHandler(
    'KeyringController:getState',
    () =>
      ({
        isUnlocked: config.isUnlocked,
        // As in the real controller, the keyring list is empty while locked;
        // the stale-account check and the mid-restore guard depend on it.
        keyrings: config.isUnlocked
          ? config.keyringIds.map((id) => ({
              type: 'HD Key Tree',
              accounts: [],
              metadata: { id, name: '' },
            }))
          : [],
      }) as KeyringControllerState,
  );

  return { messenger, config };
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
 * Publish a keyring state change, as fired on unlock and when the keyring
 * list is (re)populated.
 *
 * @param messenger - The base messenger.
 */
function publishKeyringStateChange(messenger: BaseMessenger) {
  messenger.publish(
    'KeyringController:stateChange',
    {} as KeyringControllerState,
    [],
  );
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
    const request = getInitRequestMock(buildBaseMessenger().messenger);
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
      getInitRequestMock(buildBaseMessenger().messenger),
    );

    // Both undefined means "use the controller name", i.e. persisted and
    // mirrored to the UI — unlike the money services, which opt out of both.
    expect(result.persistedStateKey).toBeUndefined();
    expect(result.memStateKey).toBeUndefined();
  });

  it('creates the account at construction when the flag is on and the wallet is unlocked', async () => {
    const { messenger } = buildBaseMessenger();

    MoneyAccountControllerInit(getInitRequestMock(messenger));
    await Promise.resolve();

    // No event is needed: a wallet that is already unlocked with the flag
    // already on would otherwise never get an account, since neither trigger
    // fires again.
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('does not create the account at construction while the wallet is locked', async () => {
    const { messenger } = buildBaseMessenger({ isUnlocked: false });

    MoneyAccountControllerInit(getInitRequestMock(messenger));
    await Promise.resolve();

    expect(init).not.toHaveBeenCalled();
  });

  it('creates the account when the remote flags arrive', async () => {
    const { messenger, config } = buildBaseMessenger({ isEnabled: false });
    MoneyAccountControllerInit(getInitRequestMock(messenger));
    await Promise.resolve();
    expect(init).not.toHaveBeenCalled();

    config.isEnabled = true;
    publishFlagChange(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('creates the account when the keyring state change lands the unlock', async () => {
    const { messenger, config } = buildBaseMessenger({ isUnlocked: false });
    MoneyAccountControllerInit(getInitRequestMock(messenger));
    await Promise.resolve();
    expect(init).not.toHaveBeenCalled();

    config.isUnlocked = true;
    publishKeyringStateChange(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('does not create the account while the wallet is locked', async () => {
    const { messenger } = buildBaseMessenger({ isUnlocked: false });
    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishFlagChange(messenger);
    await Promise.resolve();

    // The controller cannot reach the seed while locked, and throws if asked.
    expect(init).not.toHaveBeenCalled();
  });

  it('does not create the account when the feature flag is off', async () => {
    const { messenger } = buildBaseMessenger({ isEnabled: false });
    MoneyAccountControllerInit(getInitRequestMock(messenger));

    publishFlagChange(messenger);
    publishKeyringStateChange(messenger);
    await Promise.resolve();

    expect(init).not.toHaveBeenCalled();
    expect(clearState).not.toHaveBeenCalled();
  });

  it('does not create a second account once one exists', async () => {
    const { messenger } = buildBaseMessenger();
    MoneyAccountControllerInit(getInitRequestMock(messenger));
    await Promise.resolve();

    publishFlagChange(messenger);
    await Promise.resolve();
    publishKeyringStateChange(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(1);
    // An account whose entropy source still exists is not stale, so the
    // repeated triggers must not have wiped it.
    expect(clearState).not.toHaveBeenCalled();
  });

  it('replaces a stale account after a vault restore, when the recorded one belongs to a previous seed', async () => {
    const { messenger, config } = buildBaseMessenger({ isUnlocked: false });
    state.moneyAccounts = { old: moneyAccountFor('a-previous-seed') };

    MoneyAccountControllerInit(getInitRequestMock(messenger));

    config.isUnlocked = true;
    publishKeyringStateChange(messenger);
    await Promise.resolve();

    // The stale record must be removed — its entropy source no longer exists,
    // so leaving it would expose an address this wallet does not control.
    expect(clearState).toHaveBeenCalledTimes(1);
    // Counting entries would have found one and skipped, leaving the restored
    // wallet permanently without a money account.
    expect(init).toHaveBeenCalledTimes(1);
    expect(Object.values(state.moneyAccounts)).toStrictEqual([
      moneyAccountFor(PRIMARY_ENTROPY_SOURCE),
    ]);
  });

  it('leaves stale accounts untouched while the wallet is locked', async () => {
    const { messenger } = buildBaseMessenger({ isUnlocked: false });
    state.moneyAccounts = { old: moneyAccountFor('a-previous-seed') };

    MoneyAccountControllerInit(getInitRequestMock(messenger));
    publishFlagChange(messenger);
    await Promise.resolve();

    // While locked the keyring list is empty, so every account would look
    // stale; the check must not run until the vault is readable.
    expect(clearState).not.toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();
  });

  it('does nothing during the mid-restore window, then completes when the keyrings land', async () => {
    // A vault restore fires the unlock while the keyring list is still empty;
    // the restored keyrings only reach state at the end of the operation.
    const { messenger, config } = buildBaseMessenger({ keyringIds: [] });
    state.moneyAccounts = { old: moneyAccountFor('a-previous-seed') };

    MoneyAccountControllerInit(getInitRequestMock(messenger));
    publishKeyringStateChange(messenger);
    await Promise.resolve();

    // With no HD keyring nothing can be judged stale and nothing can be
    // created, so both must wait rather than wipe state or warn-and-skip.
    expect(clearState).not.toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();

    config.keyringIds = [PRIMARY_ENTROPY_SOURCE];
    publishKeyringStateChange(messenger);
    await Promise.resolve();

    expect(clearState).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledTimes(1);
    expect(Object.values(state.moneyAccounts)).toStrictEqual([
      moneyAccountFor(PRIMARY_ENTROPY_SOURCE),
    ]);
  });

  it('clears its state when the flag is turned off after an account was created', async () => {
    const { messenger, config } = buildBaseMessenger();

    MoneyAccountControllerInit(getInitRequestMock(messenger));
    await Promise.resolve();
    expect(init).toHaveBeenCalledTimes(1);

    config.isEnabled = false;
    publishFlagChange(messenger);
    await Promise.resolve();

    expect(clearState).toHaveBeenCalledTimes(1);
  });

  it('swallows a creation failure, leaving the next trigger to retry', async () => {
    const { messenger } = buildBaseMessenger();
    init.mockRejectedValue(new Error('vault is busy'));

    expect(() =>
      MoneyAccountControllerInit(getInitRequestMock(messenger)),
    ).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(() => publishFlagChange(messenger)).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    publishKeyringStateChange(messenger);
    await Promise.resolve();

    expect(init).toHaveBeenCalledTimes(3);
  });
});
