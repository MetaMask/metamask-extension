import browser from 'webextension-polyfill';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import { getPartnerByOrigin } from '../../../../shared/constants/defi-referrals';
import { ReferralTriggerType } from '../defi-referrals/createDefiReferralMiddleware';
import { createDappMetrics } from './dapp-metrics';

jest.mock('../../../../shared/constants/defi-referrals', () => ({
  getPartnerByOrigin: jest.fn(),
}));

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.fn(),
  trackEvent: jest.fn(),
}));

jest.mock('../util', () => ({
  shouldEmitDappViewedEvent: jest.fn(() => true),
}));

jest.mock('../getIframeProperties', () => ({
  getIframeProperties: jest.fn(() => ({})),
}));

const tabActivatedListeners: ((info: { tabId: number }) => void)[] = [];

jest.mock('webextension-polyfill', () => ({
  tabs: {
    onActivated: {
      addListener: (listener: (info: { tabId: number }) => void) => {
        tabActivatedListeners.push(listener);
      },
    },
  },
}));

describe('createDappMetrics', () => {
  const buildMock = jest.fn(() => ({ built: true }));
  const addProperties = jest.fn(() => ({ build: buildMock }));
  const addCategory = jest.fn(() => ({ addProperties }));
  const createBuilder = jest.fn(() => ({ addCategory }));

  beforeEach(() => {
    jest.clearAllMocks();
    (getPartnerByOrigin as jest.Mock).mockReturnValue(undefined);
    tabActivatedListeners.length = 0;
    (createEventBuilder as jest.Mock).mockImplementation(createBuilder);
    addCategory.mockImplementation(() => ({ addProperties }));
    addProperties.mockImplementation(() => ({ build: buildMock }));
    buildMock.mockReturnValue({ built: true });
  });

  function createController(overrides = {}) {
    return {
      getState: () => ({
        analyticsId: 'analytics-id',
        consentDecisionMade: true,
        optedIn: true,
      }),
      getPermittedAccounts: () => ['0xabc'],
      controllerMessenger: {
        call: jest.fn((method: string) => {
          if (method === 'AccountsController:getState') {
            return { internalAccounts: { accounts: { a: {}, b: {} } } };
          }
          if (method === 'PermissionController:hasPermissions') {
            return true;
          }
          return undefined;
        }),
      },
      permissionController: {
        state: { subjects: { 'https://dapp.test': {} } },
      },
      appStateController: {
        state: { appActiveTab: { origin: 'https://dapp.test' } },
      },
      remoteFeatureFlagController: { state: { remoteFeatureFlags: {} } },
      ...overrides,
    };
  }

  it('shouldEmitAppOpened returns false when UI is already open', () => {
    const { shouldEmitAppOpened } = createDappMetrics({
      getController: () => createController(),
      isAnyUiOpen: () => true,
    });

    expect(shouldEmitAppOpened(ENVIRONMENT_TYPE_POPUP)).toBe(false);
  });

  it('trackAppOpened emits AppOpened when UI is closed and metrics opted in', () => {
    const { trackAppOpened } = createDappMetrics({
      getController: () => createController(),
      isAnyUiOpen: () => false,
    });

    trackAppOpened(ENVIRONMENT_TYPE_SIDEPANEL);

    expect(createEventBuilder).toHaveBeenCalledWith(
      MetaMetricsEventName.AppOpened,
    );
    expect(trackEvent).toHaveBeenCalled();
  });

  it('trackDappView emits DappViewed for a connected loaded tab', () => {
    const { trackDappView } = createDappMetrics({
      getController: () => createController(),
      isAnyUiOpen: () => false,
    });

    trackDappView({
      sender: {
        tab: { id: 9, title: 'My Dapp', url: 'https://dapp.test/page' },
        url: 'https://dapp.test/page',
        frameId: 0,
      },
    } as browser.Runtime.Port);

    expect(createEventBuilder).toHaveBeenCalledWith(
      MetaMetricsEventName.DappViewed,
    );
    expect(trackEvent).toHaveBeenCalled();
  });

  it('installOnNavigateToTabListener emits DappViewed when navigating to a connected tab', () => {
    const controller = createController();
    const { trackDappView, installOnNavigateToTabListener } = createDappMetrics(
      {
        getController: () => controller,
        isAnyUiOpen: () => false,
      },
    );

    trackDappView({
      sender: {
        tab: { id: 3, title: 'My Dapp', url: 'https://dapp.test' },
        url: 'https://dapp.test',
        frameId: 0,
      },
    } as browser.Runtime.Port);

    installOnNavigateToTabListener();
    (trackEvent as jest.Mock).mockClear();

    tabActivatedListeners[0]({ tabId: 3 });

    expect(trackEvent).toHaveBeenCalled();
  });

  it('installOnNavigateToTabListener calls handleDefiReferral for connected partner tabs', async () => {
    const partner = { name: 'PartnerDapp' };
    (getPartnerByOrigin as jest.Mock).mockReturnValue(partner);

    const messengerCall = jest.fn((method: string) => {
      if (method === 'AccountsController:getState') {
        return { internalAccounts: { accounts: { a: {} } } };
      }
      if (method === 'PermissionController:hasPermissions') {
        return true;
      }
      if (method === 'LegacyBackgroundApiService:handleDefiReferral') {
        return Promise.resolve();
      }
      return undefined;
    });

    const partnerOrigin = 'https://partner.test';
    const controller = createController({
      controllerMessenger: { call: messengerCall },
      permissionController: {
        state: {
          subjects: {
            'https://partner.test': {},
            'https://iframe.partner.test': {},
          },
        },
      },
    });

    const { trackDappView, installOnNavigateToTabListener } = createDappMetrics(
      {
        getController: () => controller,
        isAnyUiOpen: () => false,
      },
    );

    trackDappView({
      sender: {
        tab: { id: 7, title: 'Partner', url: partnerOrigin },
        url: 'https://iframe.partner.test/embed',
        frameId: 1,
      },
    } as browser.Runtime.Port);

    installOnNavigateToTabListener();
    tabActivatedListeners[0]({ tabId: 7 });

    await Promise.resolve();

    expect(getPartnerByOrigin).toHaveBeenCalledWith(partnerOrigin);
    expect(messengerCall).toHaveBeenCalledWith(
      'LegacyBackgroundApiService:handleDefiReferral',
      partner,
      7,
      ReferralTriggerType.OnNavigateConnectedTab,
    );
  });

  it('trackDappView does not overwrite senderOriginMapping for the same tab', () => {
    const controller = createController({
      permissionController: {
        state: {
          subjects: {
            'https://first.test': {},
            'https://second.test': {},
          },
        },
      },
    });
    const { trackDappView, installOnNavigateToTabListener } = createDappMetrics(
      {
        getController: () => controller,
        isAnyUiOpen: () => false,
      },
    );

    const port = (senderUrl: string) =>
      ({
        sender: {
          tab: { id: 42, title: 'Loaded', url: 'https://tab.test' },
          url: senderUrl,
          frameId: 0,
        },
      }) as browser.Runtime.Port;

    trackDappView(port('https://first.test'));
    trackDappView(port('https://second.test'));

    installOnNavigateToTabListener();
    (trackEvent as jest.Mock).mockClear();
    (createEventBuilder as jest.Mock).mockClear();

    tabActivatedListeners[0]({ tabId: 42 });

    expect(createEventBuilder).toHaveBeenCalledTimes(1);
    expect(buildMock).toHaveBeenCalledWith({
      referrer: { url: 'https://first.test' },
      excludeMetaMetricsId: true,
    });
  });
});
