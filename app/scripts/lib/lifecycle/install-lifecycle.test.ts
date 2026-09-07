import type { Runtime } from 'webextension-polyfill';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '#shared/constants/metametrics';
import { getInstallAttribution } from '#shared/lib/install-attribution';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import type MetaMaskController from '../../metamask-controller';
import { onUpdate } from '../../on-update';
import {
  handleOnInstalled,
  onUpdateAvailable,
  type InstallLifecycleDependencies,
} from './install-lifecycle';

type TestInstallLifecycleDependencies = InstallLifecycleDependencies & {
  resolveInitialization: () => void;
};

jest.mock('../../on-update', () => ({
  onUpdate: jest.fn(),
}));

jest.mock('#shared/lib/install-attribution', () => ({
  getInstallAttribution: jest.fn(),
}));

jest.mock('../../controllers/analytics', () => ({
  ...jest.requireActual('../../controllers/analytics'),
  trackEvent: jest.fn(),
}));

const onUpdateMock = jest.mocked(onUpdate);
const getInstallAttributionMock = jest.mocked(getInstallAttribution);
const trackEventMock = jest.mocked(trackEvent);

function createController(
  overrides: Partial<{
    consentDecisionMade: boolean;
    optedIn: boolean;
  }> = {},
): InstallLifecycleDependencies['controller'] {
  return {
    metaMetricsController: {
      updateTraits: jest.fn(),
    },
    appStateController: {
      setDeferredDeepLink: jest.fn(),
      setPendingExtensionVersion: jest.fn(),
      setLastUpdatedAt: jest.fn(),
      setLastUpdatedFromVersion: jest.fn(),
      state: { lastUpdatedFromVersion: null },
    },
    getState: () => ({
      consentDecisionMade: overrides.consentDecisionMade ?? false,
      optedIn: overrides.optedIn ?? true,
    }),
    store: {} as MetaMaskController['store'],
  };
}

function createPlatform(
  overrides: Partial<{ getVersion: () => string }> = {},
): InstallLifecycleDependencies['platform'] {
  return {
    openExtensionInBrowser: jest.fn(),
    getVersion: overrides.getVersion ?? jest.fn(() => '13.0.0'),
  };
}

function createDeps(
  overrides: Partial<TestInstallLifecycleDependencies> = {},
): TestInstallLifecycleDependencies {
  let resolveInitialization: () => void = () => undefined;
  const isInitialized = new Promise<void>((resolve) => {
    resolveInitialization = resolve;
  });

  return {
    controller: createController(),
    platform: createPlatform(),
    isInitialized,
    requestSafeReload: jest.fn(),
    ...overrides,
    resolveInitialization,
  };
}

const installDetails = {
  reason: 'install',
} as Runtime.OnInstalledDetailsType;

describe('install-lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-20T12:34:56.789Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.IN_TEST;
    delete process.env.METAMASK_DEBUG;
  });

  describe('handleOnInstalled', () => {
    describe('install', () => {
      it('updates install traits and tracks AppInstalled', async () => {
        const deps = createDeps();
        getInstallAttributionMock.mockResolvedValue({
          deferredDeepLink: null,
          traits: {
            [MetaMetricsUserTrait.CookieId]: 'cookie-id',
          },
        });

        const handlePromise = handleOnInstalled([installDetails], deps);
        deps.resolveInitialization();
        await handlePromise;

        expect(
          deps.controller.metaMetricsController.updateTraits,
        ).toHaveBeenCalledWith({
          [MetaMetricsUserTrait.InstallDateExt]: '2026-08-20',
          [MetaMetricsUserTrait.CookieId]: 'cookie-id',
        });
        expect(trackEventMock).toHaveBeenCalledWith(
          createEventBuilder(MetaMetricsEventName.AppInstalled)
            .addCategory(MetaMetricsEventCategory.App)
            .addProperties({})
            .build(),
        );
      });

      it('persists deferred deeplink attribution on AppInstalled', async () => {
        const deps = createDeps();
        const deferredDeepLink = {
          createdAt: 1,
          referringLink: 'https://metamask.io/deeplink',
        };
        getInstallAttributionMock.mockResolvedValue({
          deferredDeepLink,
          traits: {},
        });

        const handlePromise = handleOnInstalled([installDetails], deps);
        deps.resolveInitialization();
        await handlePromise;

        expect(
          deps.controller.appStateController.setDeferredDeepLink,
        ).toHaveBeenCalledWith(deferredDeepLink);
        expect(trackEventMock).toHaveBeenCalledTimes(1);
        const [trackedEvent] = trackEventMock.mock.calls[0];
        expect(trackedEvent.name).toBe(MetaMetricsEventName.AppInstalled);
        expect(trackedEvent.properties?.install_source).toBe('deeplink');
        expect(trackedEvent.properties?.deeplink_path).toBe(
          deferredDeepLink.referringLink,
        );
      });

      it('skips tracking when the user has explicitly opted out', async () => {
        const deps = createDeps({
          controller: createController({
            consentDecisionMade: true,
            optedIn: false,
          }),
        });
        getInstallAttributionMock.mockResolvedValue({
          deferredDeepLink: null,
          traits: {},
        });

        const handlePromise = handleOnInstalled([installDetails], deps);
        deps.resolveInitialization();
        await handlePromise;

        expect(trackEventMock).not.toHaveBeenCalled();
      });

      it('reads controller after deps object creation when accessed via getter', async () => {
        const assignedController = createController();
        let controllerReady = false;
        getInstallAttributionMock.mockResolvedValue({
          deferredDeepLink: null,
          traits: {},
        });

        const deps: InstallLifecycleDependencies = {
          get controller() {
            if (!controllerReady) {
              throw new Error('controller not yet assigned');
            }
            return assignedController;
          },
          platform: createPlatform(),
          isInitialized: Promise.resolve(),
          requestSafeReload: jest.fn(),
        };

        const handlePromise = handleOnInstalled([installDetails], deps);
        controllerReady = true;
        await handlePromise;

        expect(trackEventMock).toHaveBeenCalledTimes(1);
      });

      it('opens onboarding and records install attribution after initialization', async () => {
        const deps = createDeps();
        getInstallAttributionMock.mockResolvedValue({
          deferredDeepLink: null,
          traits: {},
        });

        const handlePromise = handleOnInstalled([installDetails], deps);
        deps.resolveInitialization();
        await handlePromise;

        expect(deps.platform.openExtensionInBrowser).toHaveBeenCalledTimes(1);
        expect(getInstallAttributionMock).toHaveBeenCalledTimes(1);
        expect(trackEventMock).toHaveBeenCalledTimes(1);
      });

      it('does not open onboarding in test builds', async () => {
        process.env.IN_TEST = 'true';
        const deps = createDeps();
        getInstallAttributionMock.mockResolvedValue({
          deferredDeepLink: null,
          traits: {},
        });

        const handlePromise = handleOnInstalled([installDetails], deps);
        deps.resolveInitialization();
        await handlePromise;

        expect(deps.platform.openExtensionInBrowser).not.toHaveBeenCalled();
      });
    });

    describe('update', () => {
      it('routes update events to onUpdate after initialization', async () => {
        const deps = createDeps({
          platform: createPlatform({
            getVersion: jest.fn(() => '13.1.0'),
          }),
        });
        const details = {
          reason: 'update',
          previousVersion: '13.0.0',
        } as Runtime.OnInstalledDetailsType;

        const handlePromise = handleOnInstalled([details], deps);
        deps.resolveInitialization();
        await handlePromise;

        expect(onUpdateMock).toHaveBeenCalledWith(
          deps.controller,
          deps.platform,
          '13.0.0',
          deps.requestSafeReload,
        );
      });

      it('ignores update events when the previous version matches the current version', async () => {
        const deps = createDeps({
          platform: createPlatform({
            getVersion: jest.fn(() => '13.0.0'),
          }),
        });
        const details = {
          reason: 'update',
          previousVersion: '13.0.0',
        } as Runtime.OnInstalledDetailsType;

        await handleOnInstalled([details], deps);

        expect(onUpdateMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('onUpdateAvailable', () => {
    it('records the pending extension version after initialization', async () => {
      const deps = createDeps();
      const details = {
        version: '13.2.0',
      } as Runtime.OnUpdateAvailableDetailsType;

      const updatePromise = onUpdateAvailable(details, deps);
      deps.resolveInitialization();
      await updatePromise;

      expect(
        deps.controller.appStateController.setPendingExtensionVersion,
      ).toHaveBeenCalledWith('13.2.0');
    });
  });
});
