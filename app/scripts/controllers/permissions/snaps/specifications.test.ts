import { SnapMessage } from '@metamask/eth-snap-keyring';
import { SnapId } from '@metamask/snaps-sdk';
import { getSnapPermissionSpecifications } from './specifications';

// Capture the hooks passed to buildSnapRestrictedMethodSpecifications so we
// can call getPreferences() directly without spinning up a full messenger.
let capturedHooks: Record<string, () => unknown> = {};
jest.mock('@metamask/snaps-rpc-methods', () => ({
  buildSnapEndowmentSpecifications: jest.fn(() => ({})),
  buildSnapRestrictedMethodSpecifications: jest.fn((_excluded, hooks) => {
    capturedHooks = hooks;
    return {};
  }),
}));

const BASE_PREFERENCES_STATE = {
  currentLocale: 'en',
  openSeaEnabled: false,
  preferences: { privacyMode: false, showTestNetworks: false },
  securityAlertsEnabled: false,
  useCurrencyRateCheck: false,
  usePhishDetect: false,
  useTransactionSimulations: false,
  useTokenDetection: false,
  useMultiAccountBalanceChecker: false,
  useNftDetection: false,
};

function buildMessenger(
  overrides: Partial<Record<string, () => unknown>> = {},
) {
  const defaults: Record<string, () => unknown> = {
    'AssetsController:getState': () => ({ selectedCurrency: 'eur' }),
    'PreferencesController:getState': () => BASE_PREFERENCES_STATE,
    ...overrides,
  };

  return {
    call: jest.fn((action: string) => defaults[action]?.()),
  };
}

describe('getSnapPermissionSpecifications', () => {
  describe('getPreferences – currency source', () => {
    it('uses AssetsController selectedCurrency', () => {
      const messenger = buildMessenger({
        'AssetsController:getState': () => ({ selectedCurrency: 'eur' }),
      });

      getSnapPermissionSpecifications(messenger as never);
      const result = capturedHooks.getPreferences();

      expect(result).toMatchObject({ currency: 'eur' });
    });
  });

  describe('getSnapKeyring', () => {
    it('returns a keyring whose handleKeyringSnapMessage delegates to the messenger', async () => {
      const messenger = buildMessenger();
      getSnapPermissionSpecifications(messenger as never);

      const keyring = await (
        capturedHooks.getSnapKeyring as () => Promise<{
          handleKeyringSnapMessage: (
            snapId: SnapId,
            message: SnapMessage,
          ) => unknown;
        }>
      )();

      const snapId = 'npm:@metamask/test-snap' as SnapId;
      const message = {
        method: 'keyring_createAccount',
        params: {},
      } as SnapMessage;

      keyring.handleKeyringSnapMessage(snapId, message);

      expect(messenger.call).toHaveBeenCalledWith(
        'SnapAccountService:handleKeyringSnapMessage',
        snapId,
        message,
      );
    });
  });
});
