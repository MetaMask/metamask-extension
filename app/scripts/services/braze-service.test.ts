import { it } from '@jest/globals';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  type MockAnyNamespace,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { captureException } from '../../../shared/lib/sentry';
import { BrazeService, type BrazeServiceMessenger } from './braze-service';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

type RootMessenger = Messenger<
  MockAnyNamespace,
  MessengerActions<BrazeServiceMessenger>,
  MessengerEvents<BrazeServiceMessenger>
>;

type WalletState = {
  completedOnboarding: boolean;
  useExternalServices: boolean;
  isSignedIn: boolean;
  isUnlocked: boolean;
  canonicalProfileId?: string;
  isUiOpen: boolean;
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const eligibleState: WalletState = {
  completedOnboarding: true,
  useExternalServices: true,
  isSignedIn: true,
  isUnlocked: true,
  canonicalProfileId: 'canonical-123',
  isUiOpen: true,
};

function setup(initialState: WalletState = eligibleState) {
  let state = { ...initialState };
  let decisionError: Error | undefined;

  const rootMessenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });
  rootMessenger.registerActionHandler(
    'ClientController:getState',
    () => ({ isUiOpen: state.isUiOpen }) as never,
  );
  rootMessenger.registerActionHandler(
    'OnboardingController:getState',
    () => ({ completedOnboarding: state.completedOnboarding }) as never,
  );
  rootMessenger.registerActionHandler(
    'PreferencesController:getState',
    () => ({ useExternalServices: state.useExternalServices }) as never,
  );
  rootMessenger.registerActionHandler(
    'AuthenticationController:getState',
    () =>
      ({
        isSignedIn: state.isSignedIn,
        srpSessionData: state.canonicalProfileId
          ? {
              primary: {
                profile: { canonicalProfileId: state.canonicalProfileId },
              },
            }
          : undefined,
      }) as never,
  );
  rootMessenger.registerActionHandler('KeyringController:getState', () => {
    if (decisionError) {
      const error = decisionError;
      decisionError = undefined;
      throw error;
    }

    return {
      isUnlocked: state.isUnlocked,
      keyrings: state.isUnlocked
        ? [
            {
              type: KeyringTypes.hd,
              accounts: [],
              metadata: { id: 'primary' },
            },
          ]
        : [],
    } as never;
  });

  const messenger: BrazeServiceMessenger = new Messenger({
    namespace: 'BrazeService',
    parent: rootMessenger,
  });
  rootMessenger.delegate({
    messenger,
    actions: [
      'AuthenticationController:getState',
      'ClientController:getState',
      'KeyringController:getState',
      'OnboardingController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'AuthenticationController:stateChange',
      'ClientController:stateChange',
      'KeyringController:stateChange',
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
    ],
  });

  const syncUser = jest.fn().mockResolvedValue(undefined);

  const service = new BrazeService({
    messenger,
    syncUser,
  });

  const update = async (changes: Partial<WalletState>) => {
    state = { ...state, ...changes };
    rootMessenger.publish(
      'AuthenticationController:stateChange',
      {} as never,
      [],
    );
    await flush();
  };

  const updateUiOpen = async (isUiOpen: boolean) => {
    state = { ...state, isUiOpen };
    rootMessenger.publish('ClientController:stateChange', {} as never, []);
    await flush();
  };

  const failNextDecision = (error: Error) => {
    decisionError = error;
  };

  return { service, syncUser, update, updateUiOpen, failNextDecision };
}

describe('BrazeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('identifies the user on startup', async () => {
    const { service, syncUser } = setup();
    await flush();

    expect(service.name).toBe('BrazeService');
    expect(syncUser).toHaveBeenCalledTimes(1);
    expect(syncUser).toHaveBeenCalledWith('canonical-123');
  });

  it('clears on startup when the user is not eligible', async () => {
    const { syncUser } = setup({
      ...eligibleState,
      isSignedIn: false,
    });
    await flush();

    expect(syncUser).toHaveBeenCalledWith(null);
  });

  it('sends nothing on startup while the wallet is locked', async () => {
    const { syncUser } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    await flush();

    expect(syncUser).not.toHaveBeenCalled();
  });

  it('sends nothing on startup while no UI document is open', async () => {
    const { syncUser } = setup({
      ...eligibleState,
      isUiOpen: false,
    });
    await flush();

    expect(syncUser).not.toHaveBeenCalled();
  });

  it('identifies when a UI document opens', async () => {
    const { syncUser, updateUiOpen } = setup({
      ...eligibleState,
      isUiOpen: false,
    });
    await flush();
    expect(syncUser).not.toHaveBeenCalled();

    await updateUiOpen(true);

    expect(syncUser).toHaveBeenCalledWith('canonical-123');
  });

  it('identifies again when a UI document opens after closing', async () => {
    const { syncUser, updateUiOpen } = setup();
    await flush();
    syncUser.mockClear();

    await updateUiOpen(false);
    await updateUiOpen(true);

    expect(syncUser).toHaveBeenCalledWith('canonical-123');
  });

  it('does not clear when the last UI document closes', async () => {
    const { syncUser, updateUiOpen } = setup();
    await flush();
    syncUser.mockClear();

    await updateUiOpen(false);

    expect(syncUser).not.toHaveBeenCalled();
  });

  it('clears while no UI document is open', async () => {
    const { syncUser } = setup({
      ...eligibleState,
      isUiOpen: false,
      isSignedIn: false,
    });
    await flush();

    expect(syncUser).toHaveBeenCalledWith(null);
  });

  it('identifies after unlock', async () => {
    const { syncUser, update } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    await flush();

    await update({ isUnlocked: true });

    expect(syncUser).toHaveBeenCalledWith('canonical-123');
  });

  it('does not clear on lock', async () => {
    const { syncUser, update } = setup();
    await flush();
    syncUser.mockClear();

    await update({ isUnlocked: false });

    expect(syncUser).not.toHaveBeenCalled();
  });

  it.each([
    ['sign-out', { isSignedIn: false }],
    ['Basic Functionality opt-out', { useExternalServices: false }],
  ])('clears on %s', async (_, change) => {
    const { syncUser, update } = setup();
    await flush();

    await update(change);

    expect(syncUser).toHaveBeenLastCalledWith(null);
  });

  it('clears on sign-out while the wallet is locked', async () => {
    const { syncUser, update } = setup();
    await flush();
    await update({ isUnlocked: false });

    await update({ isSignedIn: false });

    expect(syncUser).toHaveBeenLastCalledWith(null);
  });

  it('re-identifies when the canonical profile ID changes', async () => {
    const { syncUser, update } = setup();
    await flush();

    await update({ canonicalProfileId: 'canonical-456' });

    expect(syncUser).toHaveBeenLastCalledWith('canonical-456');
  });

  it('does not resend an unchanged user', async () => {
    const { syncUser, update } = setup();
    await flush();

    await update({});
    await update({});

    expect(syncUser).toHaveBeenCalledTimes(1);
  });

  it('coalesces updates that arrive before the queue runs', async () => {
    const { syncUser, update } = setup();
    await flush();

    await Promise.all([
      update({ isSignedIn: false }),
      update({ isSignedIn: true }),
    ]);

    expect(syncUser.mock.calls).toStrictEqual([['canonical-123']]);
  });

  it('retries on the next state change after a failure', async () => {
    const { syncUser, update } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    await flush();
    const error = new Error('SDK unavailable');
    syncUser.mockRejectedValueOnce(error);

    await update({ isUnlocked: true });

    expect(captureException).toHaveBeenCalledWith(error);
    expect(syncUser).toHaveBeenCalledTimes(1);

    await update({});

    expect(syncUser).toHaveBeenCalledTimes(2);
    expect(syncUser).toHaveBeenLastCalledWith('canonical-123');
  });

  it('keeps syncing after a failed decision', async () => {
    const { syncUser, update, failNextDecision } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    await flush();
    const error = new Error('state unavailable');

    failNextDecision(error);
    await update({ isUnlocked: true });

    expect(captureException).toHaveBeenCalledWith(error);
    expect(syncUser).not.toHaveBeenCalled();

    await update({});

    expect(syncUser).toHaveBeenCalledWith('canonical-123');
  });
});
