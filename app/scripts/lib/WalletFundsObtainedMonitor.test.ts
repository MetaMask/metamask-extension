/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  INotification,
  TRIGGER_TYPES,
} from '@metamask/notification-services-controller/notification-services';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  WalletFundsObtainedMonitor,
  WalletFundsObtainedMonitorMessenger,
} from './WalletFundsObtainedMonitor';

function createMessengerMock(): jest.Mocked<WalletFundsObtainedMonitorMessenger> {
  return {
    call: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  } as unknown as jest.Mocked<WalletFundsObtainedMonitorMessenger>;
}

describe('WalletFundsObtainedMonitor', () => {
  let messenger: jest.Mocked<WalletFundsObtainedMonitorMessenger>;
  let walletFundsObtainedMonitor: WalletFundsObtainedMonitor;

  beforeEach(() => {
    messenger = createMessengerMock();

    // Setup default mock implementations
    messenger.call.mockImplementation(((action: string) => {
      if (action === 'OnboardingController:getState') {
        return {
          seedPhraseBackedUp: false,
          firstTimeFlowType: FirstTimeFlowType.create,
          completedOnboarding: true,
        };
      }
      if (action === 'NotificationServicesController:getState') {
        return { isNotificationServicesEnabled: true };
      }
      if (action === 'TokenBalancesController:getState') {
        return { tokenBalances: {} };
      }
      if (action === 'MultichainBalancesController:getState') {
        return { balances: {} };
      }
      return undefined;
    }) as any);

    walletFundsObtainedMonitor = new WalletFundsObtainedMonitor({
      messenger,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('setupMonitoring', () => {
    it('should return early and set canTrackWalletFundsObtained to false if notifications are disabled', () => {
      messenger.call.mockImplementation(((action: string) => {
        if (action === 'OnboardingController:getState') {
          return {
            seedPhraseBackedUp: false,
            firstTimeFlowType: FirstTimeFlowType.create,
            completedOnboarding: false,
          };
        }
        if (action === 'NotificationServicesController:getState') {
          return { isNotificationServicesEnabled: false };
        }
        return undefined;
      }) as any);

      walletFundsObtainedMonitor.setupMonitoring();

      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should return early and set canTrackWalletFundsObtained to false if wallet was not created (imported)', () => {
      messenger.call.mockImplementation(((action: string) => {
        if (action === 'OnboardingController:getState') {
          return {
            seedPhraseBackedUp: false,
            firstTimeFlowType: FirstTimeFlowType.import,
            completedOnboarding: true,
          };
        }
        return undefined;
      }) as any);

      walletFundsObtainedMonitor.setupMonitoring();

      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should call setCanTrackWalletFundsObtained if wallet has existing funds', () => {
      messenger.call.mockImplementation(((action: string) => {
        if (action === 'OnboardingController:getState') {
          return {
            seedPhraseBackedUp: false,
            firstTimeFlowType: FirstTimeFlowType.create,
            completedOnboarding: true,
          };
        }
        if (action === 'NotificationServicesController:getState') {
          return { isNotificationServicesEnabled: true };
        }
        if (action === 'TokenBalancesController:getState') {
          return {
            tokenBalances: {
              '0x123': {
                '0x1': {
                  '0x456': '0x100',
                },
              },
            },
          };
        }
        return undefined;
      }) as any);

      walletFundsObtainedMonitor.setupMonitoring();

      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should subscribe to notifications if wallet has no existing funds', () => {
      walletFundsObtainedMonitor.setupMonitoring();

      expect(messenger.subscribe).toHaveBeenCalledWith(
        'NotificationServicesController:notificationsListUpdated',
        expect.any(Function),
      );
    });

    it('should not subscribe multiple times when setupMonitoring is called repeatedly', () => {
      walletFundsObtainedMonitor.setupMonitoring();
      walletFundsObtainedMonitor.setupMonitoring();
      walletFundsObtainedMonitor.setupMonitoring();

      // Should only subscribe once
      expect(messenger.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('createWalletFundingNotificationHandler', () => {
    beforeEach(() => {
      // Setup monitoring first
      walletFundsObtainedMonitor.setupMonitoring();

      // Get the subscription handler
      const subscribeCall = messenger.subscribe.mock.calls.find(
        (call) =>
          call[0] === 'NotificationServicesController:notificationsListUpdated',
      );
      const handler = subscribeCall?.[1];

      // Setup a helper to trigger notifications
      (messenger as any).triggerMockNotifications = (
        notifications: INotification[],
      ) => {
        if (handler) {
          handler(notifications, []);
        }
      };

      // Clear previous calls to have clean test assertions
      messenger.call.mockClear();
      messenger.unsubscribe.mockClear();
    });

    it('should return early if no relevant notifications', () => {
      const notifications = [
        { type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT, data: {} },
      ];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).not.toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.anything(),
      );
      expect(messenger.call).not.toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should return early if notifications array is empty', () => {
      const notifications: INotification[] = [];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).not.toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.anything(),
      );
      expect(messenger.call).not.toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should return early if notification has no chain_id', () => {
      const notifications = [
        {
          type: TRIGGER_TYPES.ETH_RECEIVED,
          data: { amount: { usd: '100' } },
        },
      ];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).not.toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.anything(),
      );
      expect(messenger.call).not.toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should return early if notification has no token or amount data', () => {
      const notifications = [
        {
          type: TRIGGER_TYPES.ETH_RECEIVED,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: 1,
          data: {},
        },
      ];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).not.toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.anything(),
      );
      expect(messenger.call).not.toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should handle ETH received notification', () => {
      const notifications = [
        {
          type: TRIGGER_TYPES.ETH_RECEIVED,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: 1,
          data: {
            amount: { usd: '100' },
          },
        },
      ];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.objectContaining({
          event: 'Wallet Funds Obtained',
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            funding_amount_usd: '$100-1000',
          }),
        }),
      );
      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
      expect(messenger.unsubscribe).toHaveBeenCalledWith(
        'NotificationServicesController:notificationsListUpdated',
        expect.any(Function),
      );
    });

    it('should handle ERC20 received notification', () => {
      const notifications = [
        {
          type: TRIGGER_TYPES.ERC20_RECEIVED,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: 1,
          data: {
            token: {
              address: '0x123',
              usd: '50',
            },
          },
        },
      ];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.objectContaining({
          event: 'Wallet Funds Obtained',
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            funding_amount_usd: '<$100',
          }),
        }),
      );
      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
      expect(messenger.unsubscribe).toHaveBeenCalledWith(
        'NotificationServicesController:notificationsListUpdated',
        expect.any(Function),
      );
    });

    it('should use the last (oldest) notification when multiple are present', () => {
      const notifications = [
        {
          type: TRIGGER_TYPES.ETH_RECEIVED,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: 1,
          data: { amount: { usd: '100' } },
        },
        {
          type: TRIGGER_TYPES.ERC20_RECEIVED,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: 137,
          data: { token: { address: '0x456', usd: '200' } },
        },
      ];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.objectContaining({
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:137',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            funding_amount_usd: '$100-1000',
          }),
        }),
      );
      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });

    it('should filter out non-funding notifications', () => {
      const notifications = [
        {
          type: TRIGGER_TYPES.ETH_RECEIVED,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: 1,
          data: { amount: { usd: '100' } },
        },
        { type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT, data: {} },
      ];

      (messenger as any).triggerMockNotifications(notifications);

      expect(messenger.call).toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.objectContaining({
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:1',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            funding_amount_usd: '$100-1000',
          }),
        }),
      );
      expect(messenger.call).toHaveBeenCalledWith(
        'AppStateController:setCanTrackWalletFundsObtained',
        false,
      );
    });
  });
});
