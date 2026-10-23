import { it } from '@jest/globals';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  type MockAnyNamespace,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  BrazeAction,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
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
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const eligibleState: WalletState = {
  completedOnboarding: true,
  useExternalServices: true,
  isSignedIn: true,
  isUnlocked: true,
  canonicalProfileId: 'canonical-123',
};

function setup(initialState: WalletState = eligibleState) {
  let state = { ...initialState };
  let decisionError: Error | undefined;

  const rootMessenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });
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
      'KeyringController:getState',
      'OnboardingController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'AuthenticationController:stateChange',
      'KeyringController:stateChange',
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
    ],
  });

  const sendToOffscreen = jest.fn().mockResolvedValue({ success: true });

  const service = new BrazeService({
    messenger,
    offscreenReady: Promise.resolve(),
    sendToOffscreen,
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

  const failNextDecision = (error: Error) => {
    decisionError = error;
  };

  return { service, sendToOffscreen, update, failNextDecision };
}

const syncMessage = (profileId: string | null) => ({
  target: OffscreenCommunicationTarget.brazeOffscreen,
  action: BrazeAction.syncUser,
  profileId,
});

describe('BrazeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('identifies the user on startup', async () => {
    const { service, sendToOffscreen } = setup();
    await flush();

    expect(service.name).toBe('BrazeService');
    expect(sendToOffscreen).toHaveBeenCalledTimes(1);
    expect(sendToOffscreen).toHaveBeenCalledWith(syncMessage('canonical-123'));
  });

  it('clears on startup when the user is not eligible', async () => {
    const { sendToOffscreen } = setup({
      ...eligibleState,
      isSignedIn: false,
    });
    await flush();

    expect(sendToOffscreen).toHaveBeenCalledWith(syncMessage(null));
  });

  it('sends nothing on startup while the wallet is locked', async () => {
    const { sendToOffscreen } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    await flush();

    expect(sendToOffscreen).not.toHaveBeenCalled();
  });

  it('identifies after unlock', async () => {
    const { sendToOffscreen, update } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    await flush();

    await update({ isUnlocked: true });

    expect(sendToOffscreen).toHaveBeenCalledWith(syncMessage('canonical-123'));
  });

  it('does not clear on lock', async () => {
    const { sendToOffscreen, update } = setup();
    await flush();
    sendToOffscreen.mockClear();

    await update({ isUnlocked: false });

    expect(sendToOffscreen).not.toHaveBeenCalled();
  });

  it.each([
    ['sign-out', { isSignedIn: false }],
    ['Basic Functionality opt-out', { useExternalServices: false }],
  ])('clears on %s', async (_, change) => {
    const { sendToOffscreen, update } = setup();
    await flush();

    await update(change);

    expect(sendToOffscreen).toHaveBeenLastCalledWith(syncMessage(null));
  });

  it('clears on sign-out while the wallet is locked', async () => {
    const { sendToOffscreen, update } = setup();
    await flush();
    await update({ isUnlocked: false });

    await update({ isSignedIn: false });

    expect(sendToOffscreen).toHaveBeenLastCalledWith(syncMessage(null));
  });

  it('re-identifies when the canonical profile ID changes', async () => {
    const { sendToOffscreen, update } = setup();
    await flush();

    await update({ canonicalProfileId: 'canonical-456' });

    expect(sendToOffscreen).toHaveBeenLastCalledWith(
      syncMessage('canonical-456'),
    );
  });

  it('does not resend an unchanged user', async () => {
    const { sendToOffscreen, update } = setup();
    await flush();

    await update({});
    await update({});

    expect(sendToOffscreen).toHaveBeenCalledTimes(1);
  });

  it('sends updates in order', async () => {
    const { sendToOffscreen, update } = setup();
    await flush();

    await Promise.all([
      update({ isSignedIn: false }),
      update({ isSignedIn: true }),
    ]);

    expect(
      sendToOffscreen.mock.calls.map(([message]) => message),
    ).toStrictEqual([syncMessage('canonical-123')]);
  });

  it('reports failures without retrying the same user', async () => {
    const { sendToOffscreen, update } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    sendToOffscreen.mockResolvedValueOnce({
      success: false,
      error: 'SDK unavailable',
    });

    await update({ isUnlocked: true });
    await update({});

    expect(captureException).toHaveBeenCalledWith(
      new Error('Braze user sync failed: SDK unavailable'),
    );
    expect(sendToOffscreen).toHaveBeenCalledTimes(1);
  });

  it('keeps syncing after a failed decision', async () => {
    const { sendToOffscreen, update, failNextDecision } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    await flush();
    const error = new Error('state unavailable');

    failNextDecision(error);
    await update({ isUnlocked: true });

    expect(captureException).toHaveBeenCalledWith(error);
    expect(sendToOffscreen).not.toHaveBeenCalled();

    await update({});

    expect(sendToOffscreen).toHaveBeenCalledWith(syncMessage('canonical-123'));
  });

  it('reports a missing offscreen document', async () => {
    const { sendToOffscreen, update } = setup({
      ...eligibleState,
      isUnlocked: false,
    });
    const error = new Error('Receiving end does not exist.');
    sendToOffscreen.mockRejectedValueOnce(error);

    await update({ isUnlocked: true });

    expect(captureException).toHaveBeenCalledWith(error);
  });
});
