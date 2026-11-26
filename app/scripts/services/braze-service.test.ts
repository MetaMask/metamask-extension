import { it } from '@jest/globals';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  type MockAnyNamespace,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { HandlerType, SnapStatus } from '@metamask/snaps-utils';
import { captureException } from '../../../shared/lib/sentry';
import {
  BRAZE_SNAP_ID,
  BrazeService,
  type BrazeServiceMessenger,
} from './braze-service';

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
  optedIn: boolean;
  optedInToMarketing?: boolean;
  isSignedIn: boolean;
  isUnlocked: boolean;
  canonicalProfileId?: string;
  currentLocale: string;
  isUiOpen: boolean;
  snapStatus: SnapStatus | null;
};

const ENV = {
  BRAZE_WEB_API_KEY: '00000000-0000-0000-0000-000000000000',
  BRAZE_SDK_ENDPOINT: 'sdk.iad-01.braze.com',
  METAMASK_VERSION: '13.0.0',
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const eligibleState: WalletState = {
  completedOnboarding: true,
  useExternalServices: true,
  optedIn: true,
  optedInToMarketing: false,
  isSignedIn: true,
  isUnlocked: true,
  canonicalProfileId: 'canonical-123',
  currentLocale: 'en',
  isUiOpen: true,
  snapStatus: SnapStatus.Stopped,
};

const lockedState: WalletState = {
  ...eligibleState,
  isUnlocked: false,
  isSignedIn: false,
  canonicalProfileId: undefined,
};

function setup(initialState: WalletState = eligibleState) {
  let state = { ...initialState };
  let decisionError: Error | undefined;

  const rootMessenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  const handleRequest = jest.fn().mockResolvedValue({ flushed: true });
  const getSnap = jest
    .fn()
    .mockImplementation(() =>
      state.snapStatus === null
        ? null
        : { id: BRAZE_SNAP_ID, status: state.snapStatus },
    );
  const stopSnap = jest.fn().mockResolvedValue(undefined);
  const clearSnapState = jest.fn();

  rootMessenger.registerActionHandler(
    'AnalyticsController:getState',
    () =>
      ({
        optedIn: state.optedIn,
        optedInToMarketing: state.optedInToMarketing,
      }) as never,
  );
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
    () =>
      ({
        useExternalServices: state.useExternalServices,
        currentLocale: state.currentLocale,
      }) as never,
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
        ? [{ type: KeyringTypes.hd, accounts: [], metadata: { id: 'primary' } }]
        : [],
    } as never;
  });
  rootMessenger.registerActionHandler(
    'SnapController:handleRequest',
    handleRequest,
  );
  rootMessenger.registerActionHandler('SnapController:getSnap', getSnap);
  rootMessenger.registerActionHandler('SnapController:stopSnap', stopSnap);
  rootMessenger.registerActionHandler(
    'SnapController:clearSnapState',
    clearSnapState,
  );

  const messenger: BrazeServiceMessenger = new Messenger({
    namespace: 'BrazeService',
    parent: rootMessenger,
  });
  rootMessenger.delegate({
    messenger,
    actions: [
      'AnalyticsController:getState',
      'AuthenticationController:getState',
      'ClientController:getState',
      'KeyringController:getState',
      'OnboardingController:getState',
      'PreferencesController:getState',
      'SnapController:clearSnapState',
      'SnapController:getSnap',
      'SnapController:handleRequest',
      'SnapController:stopSnap',
    ],
    events: [
      'AnalyticsController:stateChange',
      'AuthenticationController:stateChange',
      'ClientController:stateChange',
      'KeyringController:stateChange',
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
      'SnapController:snapInstalled',
      'SnapController:snapUpdated',
    ],
  });

  const service = new BrazeService({ messenger });

  const update = async (
    changes: Partial<WalletState>,
    event:
      | 'AuthenticationController:stateChange'
      | 'ClientController:stateChange'
      | 'AnalyticsController:stateChange' = 'AuthenticationController:stateChange',
  ) => {
    state = { ...state, ...changes };
    rootMessenger.publish(event, {} as never, []);
    await flush();
  };

  const lockWithLegacySignOut = async () => {
    state = { ...state, isUnlocked: false };
    rootMessenger.publish('KeyringController:stateChange', {} as never, []);
    state = { ...state, isSignedIn: false, canonicalProfileId: undefined };
    rootMessenger.publish(
      'AuthenticationController:stateChange',
      {} as never,
      [],
    );
    await flush();
  };

  const publishSnapEvent = async (
    event: 'SnapController:snapInstalled' | 'SnapController:snapUpdated',
    snapId = BRAZE_SNAP_ID,
    snapStatus: SnapStatus = SnapStatus.Stopped,
  ) => {
    state = { ...state, snapStatus };
    if (event === 'SnapController:snapInstalled') {
      rootMessenger.publish(
        'SnapController:snapInstalled',
        { id: snapId } as never,
        'metamask',
        true,
      );
    } else {
      rootMessenger.publish(
        'SnapController:snapUpdated',
        { id: snapId } as never,
        '0.0.0',
        'metamask',
        true,
        false,
      );
    }
    await flush();
  };

  return {
    service,
    handleRequest,
    stopSnap,
    clearSnapState,
    update,
    lockWithLegacySignOut,
    publishSnapEvent,
    failNextDecision: (error: Error) => {
      decisionError = error;
    },
    setState: (changes: Partial<WalletState>) => {
      state = { ...state, ...changes };
    },
  };
}

describe('BrazeService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, ...ENV };
    delete process.env.METAMASK_DEBUG;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('identifies on startup and sets enableLogging in debug builds', async () => {
    process.env.METAMASK_DEBUG = 'true';
    const { service, handleRequest, clearSnapState } = setup();
    await flush();

    expect(service.name).toBe('BrazeService');
    expect(handleRequest).toHaveBeenCalledTimes(1);
    expect(handleRequest).toHaveBeenCalledWith({
      snapId: BRAZE_SNAP_ID,
      origin: 'metamask',
      handler: HandlerType.OnClientRequest,
      request: {
        jsonrpc: '2.0',
        method: 'syncUser',
        params: {
          profileId: 'canonical-123',
          language: 'en',
          config: {
            apiKey: ENV.BRAZE_WEB_API_KEY,
            endpoint: ENV.BRAZE_SDK_ENDPOINT,
            appVersion: ENV.METAMASK_VERSION,
            enableLogging: true,
          },
        },
      },
    });
    expect(clearSnapState).not.toHaveBeenCalled();
  });

  it('clears on startup when ineligible and skips clearing when snap is missing', async () => {
    const first = setup({ ...eligibleState, completedOnboarding: false });
    await flush();

    expect(first.stopSnap).toHaveBeenCalledWith(BRAZE_SNAP_ID);
    expect(first.clearSnapState).toHaveBeenCalledWith(BRAZE_SNAP_ID, false);
    expect(first.stopSnap.mock.invocationCallOrder[0]).toBeLessThan(
      first.clearSnapState.mock.invocationCallOrder[0],
    );
    expect(first.handleRequest).not.toHaveBeenCalled();

    const missing = setup({
      ...eligibleState,
      useExternalServices: false,
      snapStatus: null,
    });
    await flush();

    expect(missing.stopSnap).not.toHaveBeenCalled();
    expect(missing.clearSnapState).not.toHaveBeenCalled();
  });

  it('keeps state while locked or without UI open, and re-syncs when UI reopens', async () => {
    const locked = setup(lockedState);
    await flush();
    expect(locked.handleRequest).not.toHaveBeenCalled();
    expect(locked.clearSnapState).not.toHaveBeenCalled();

    const closed = setup({ ...eligibleState, isUiOpen: false });
    await flush();
    expect(closed.handleRequest).not.toHaveBeenCalled();

    await closed.update({ isUiOpen: true }, 'ClientController:stateChange');
    expect(closed.handleRequest).toHaveBeenCalledTimes(1);

    await closed.update({ isUiOpen: false }, 'ClientController:stateChange');
    await closed.update({ isUiOpen: true }, 'ClientController:stateChange');
    expect(closed.handleRequest).toHaveBeenCalledTimes(2);
  });

  it('preserves Braze state on wallet lock (including performSignOut) and resumes after unlock sign-in', async () => {
    const {
      handleRequest,
      stopSnap,
      clearSnapState,
      lockWithLegacySignOut,
      update,
    } = setup();
    await flush();
    handleRequest.mockClear();

    await lockWithLegacySignOut();
    expect(stopSnap).not.toHaveBeenCalled();
    expect(clearSnapState).not.toHaveBeenCalled();
    expect(handleRequest).not.toHaveBeenCalled();

    // Unlocked before auto-sign-in finishes.
    await update({ isUnlocked: true });
    expect(clearSnapState).not.toHaveBeenCalled();
    expect(handleRequest).not.toHaveBeenCalled();

    await update({ isSignedIn: true, canonicalProfileId: 'canonical-123' });
    expect(handleRequest).toHaveBeenCalledTimes(1);
  });

  it('clears on opt-out (even when locked) and re-identifies when consent returns', async () => {
    const { handleRequest, clearSnapState, lockWithLegacySignOut, update } =
      setup();
    await flush();

    await update(
      { optedIn: false, optedInToMarketing: false },
      'AnalyticsController:stateChange',
    );
    expect(clearSnapState).toHaveBeenCalledTimes(1);

    await update({ isUnlocked: false });
    expect(clearSnapState).toHaveBeenCalledTimes(1);

    await update(
      { optedInToMarketing: true },
      'AnalyticsController:stateChange',
    );
    await update({
      isUnlocked: true,
      isSignedIn: true,
      canonicalProfileId: 'canonical-123',
    });
    expect(handleRequest).toHaveBeenCalledTimes(2);

    await lockWithLegacySignOut();
    await update(
      { optedIn: false, optedInToMarketing: false },
      'AnalyticsController:stateChange',
    );
    expect(clearSnapState).toHaveBeenCalledTimes(2);
  });

  it('defers clearing while snap is Installing and retries on snapUpdated', async () => {
    const { stopSnap, clearSnapState, publishSnapEvent, setState } = setup({
      ...eligibleState,
      useExternalServices: false,
      snapStatus: SnapStatus.Installing,
    });
    await flush();
    expect(clearSnapState).not.toHaveBeenCalled();

    await publishSnapEvent(
      'SnapController:snapUpdated',
      'npm:@metamask/other-snap' as never,
      SnapStatus.Installing,
    );
    expect(clearSnapState).not.toHaveBeenCalled();

    setState({ snapStatus: SnapStatus.Stopped });
    await publishSnapEvent('SnapController:snapUpdated');
    expect(stopSnap).toHaveBeenCalledTimes(1);
    expect(clearSnapState).toHaveBeenCalledTimes(1);
  });

  it('re-identifies on snapInstalled, profile changes, and locale changes', async () => {
    const { handleRequest, publishSnapEvent, update } = setup({
      ...eligibleState,
      currentLocale: '',
    });
    await flush();

    expect(handleRequest.mock.calls[0][0].request.params).not.toHaveProperty(
      'language',
    );

    await publishSnapEvent('SnapController:snapInstalled');
    expect(handleRequest).toHaveBeenCalledTimes(2);

    await update({
      canonicalProfileId: 'canonical-456',
      currentLocale: 'pt_BR',
    });
    expect(handleRequest).toHaveBeenCalledTimes(3);
    expect(handleRequest.mock.calls[2][0].request.params).toMatchObject({
      profileId: 'canonical-456',
      language: 'pt',
    });
  });

  it('coalesces updates that arrive before the queue runs', async () => {
    const { handleRequest, clearSnapState, update } = setup();
    await flush();

    await Promise.all([
      update({ useExternalServices: false }),
      update({ useExternalServices: true }),
    ]);

    expect(handleRequest).toHaveBeenCalledTimes(1);
    expect(clearSnapState).not.toHaveBeenCalled();
  });

  it('retries on flushed: false without Sentry noise, and retries/reports unexpected failures', async () => {
    const { handleRequest, stopSnap, clearSnapState, update } =
      setup(lockedState);
    await flush();
    handleRequest.mockResolvedValueOnce({ flushed: false });

    await update({
      isUnlocked: true,
      isSignedIn: true,
      canonicalProfileId: 'canonical-123',
    });
    expect(captureException).not.toHaveBeenCalled();
    expect(handleRequest).toHaveBeenCalledTimes(1);

    const identifyError = new Error('Snap unavailable');
    handleRequest.mockRejectedValueOnce(identifyError);
    await update({});
    expect(captureException).toHaveBeenCalledWith(identifyError);
    expect(handleRequest).toHaveBeenCalledTimes(2);

    await update({});
    expect(handleRequest).toHaveBeenCalledTimes(3);

    const clearError = new Error('Stop failed');
    stopSnap.mockRejectedValueOnce(clearError);
    await update({ useExternalServices: false });
    expect(captureException).toHaveBeenCalledWith(clearError);

    await update({});
    expect(clearSnapState).toHaveBeenCalledTimes(1);
  });

  it('suppresses Sentry noise on cancelled identify after opt-out and recovers from decision errors', async () => {
    let rejectIdentify!: (error: Error) => void;
    const { handleRequest, clearSnapState, update, failNextDecision } =
      setup(lockedState);
    await flush();
    handleRequest.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectIdentify = reject;
        }),
    );

    const identifyUpdate = update({
      isUnlocked: true,
      isSignedIn: true,
      canonicalProfileId: 'canonical-123',
    });
    await flush();

    const optOutUpdate = update({ useExternalServices: false });
    rejectIdentify(new Error('Snap was stopped'));
    await Promise.all([identifyUpdate, optOutUpdate]);

    expect(captureException).not.toHaveBeenCalled();
    expect(clearSnapState).toHaveBeenCalledTimes(1);

    const decisionError = new Error('state unavailable');
    failNextDecision(decisionError);
    await update({ useExternalServices: true });
    expect(captureException).toHaveBeenCalledWith(decisionError);

    const realError = new Error('Snap crash');
    handleRequest.mockImplementationOnce(async () => {
      failNextDecision(new Error('state unavailable'));
      throw realError;
    });
    await update({});
    expect(captureException).toHaveBeenCalledWith(realError);
  });
});
