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

  const host = {
    syncUser: jest.fn().mockResolvedValue(undefined),
    getBanner: jest.fn().mockResolvedValue(null),
    logBannerInteraction: jest.fn().mockResolvedValue(undefined),
  };
  const { syncUser } = host;

  const service = new BrazeService({
    messenger,
    host,
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

  return {
    service,
    host,
    rootMessenger,
    syncUser,
    update,
    updateUiOpen,
    failNextDecision,
  };
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

  describe('banners', () => {
    const PLACEMENT_ID = 'extension-wallet-home';
    const banner = {
      id: 'banner-1',
      placementId: PLACEMENT_ID,
      isControl: false,
      title: null,
      body: 'Explore your wallet',
      imageUrl: null,
      ctaLabel: null,
      deeplink: null,
    };

    it('returns the banner for the identified user', async () => {
      const { host, rootMessenger } = setup();
      host.getBanner.mockResolvedValueOnce(banner);

      expect(
        await rootMessenger.call('BrazeService:getBanner', PLACEMENT_ID),
      ).toStrictEqual(banner);
      expect(host.getBanner).toHaveBeenCalledWith(PLACEMENT_ID);
    });

    it('waits for a pending sync before getting the banner', async () => {
      const { host, rootMessenger, updateUiOpen } = setup();
      await flush();
      let resolveSync: () => void = () => undefined;
      host.syncUser.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveSync = resolve;
        }),
      );
      await updateUiOpen(true);

      const result = rootMessenger.call('BrazeService:getBanner', PLACEMENT_ID);
      await flush();
      expect(host.getBanner).not.toHaveBeenCalled();
      resolveSync();
      await result;

      expect(host.getBanner).toHaveBeenCalled();
    });

    it.each([
      ['the wallet was never unlocked', { isUnlocked: false }],
      ['the user is signed out', { isSignedIn: false }],
      ['Basic Functionality is off', { useExternalServices: false }],
    ])('returns null when %s', async (_, change) => {
      const { host, rootMessenger } = setup({ ...eligibleState, ...change });

      expect(
        await rootMessenger.call('BrazeService:getBanner', PLACEMENT_ID),
      ).toBeNull();
      expect(host.getBanner).not.toHaveBeenCalled();
    });

    it('returns null after the user changes until the new user is synced', async () => {
      const { host, rootMessenger, update } = setup();
      await flush();
      host.syncUser.mockRejectedValueOnce(new Error('SDK unavailable'));
      await update({ canonicalProfileId: 'canonical-456' });

      expect(
        await rootMessenger.call('BrazeService:getBanner', PLACEMENT_ID),
      ).toBeNull();
      expect(host.getBanner).not.toHaveBeenCalled();
    });

    it('returns null for an unknown placement', async () => {
      const { host, rootMessenger } = setup();

      expect(
        await rootMessenger.call('BrazeService:getBanner', 'other-placement'),
      ).toBeNull();
      expect(host.getBanner).not.toHaveBeenCalled();
    });

    it('returns null when the host fails', async () => {
      const { host, rootMessenger } = setup();
      const error = new Error('SDK unavailable');
      host.getBanner.mockRejectedValueOnce(error);

      expect(
        await rootMessenger.call('BrazeService:getBanner', PLACEMENT_ID),
      ).toBeNull();
      expect(captureException).toHaveBeenCalledWith(error);
    });

    it.each([
      { action: 'BrazeService:logBannerImpression', interaction: 'impression' },
      { action: 'BrazeService:logBannerClick', interaction: 'click' },
      { action: 'BrazeService:dismissBanner', interaction: 'dismiss' },
    ] as const)(
      'forwards $action to the host',
      async ({ action, interaction }) => {
        const { host, rootMessenger } = setup();

        await rootMessenger.call(action, PLACEMENT_ID, 'banner-1');

        expect(host.logBannerInteraction).toHaveBeenCalledWith(
          PLACEMENT_ID,
          'banner-1',
          interaction,
        );
      },
    );

    it('does not forward interactions for a user who is not identified', async () => {
      const { host, rootMessenger } = setup({
        ...eligibleState,
        isSignedIn: false,
      });

      await rootMessenger.call(
        'BrazeService:logBannerImpression',
        PLACEMENT_ID,
        'banner-1',
      );

      expect(host.logBannerInteraction).not.toHaveBeenCalled();
    });

    it('reports interaction failures', async () => {
      const { host, rootMessenger } = setup();
      const error = new Error('SDK unavailable');
      host.logBannerInteraction.mockRejectedValueOnce(error);

      await rootMessenger.call(
        'BrazeService:dismissBanner',
        PLACEMENT_ID,
        'banner-1',
      );

      expect(captureException).toHaveBeenCalledWith(error);
    });
  });
});
