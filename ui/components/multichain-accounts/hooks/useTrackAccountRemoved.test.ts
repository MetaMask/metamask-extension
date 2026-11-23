import type { AccountWalletObject } from '@metamask/account-tree-controller';
import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  MetaMetricsAccountRemovedLocation,
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
} from '../../../../shared/constants/metametrics';
import { useTrackAccountRemoved } from './useTrackAccountRemoved';

jest.mock('../../../hooks/useAnalytics', () => {
  const mockTrackEvent = jest.fn().mockResolvedValue(undefined);

  return {
    useAnalytics: () => ({
      createEventBuilder: jest.requireActual(
        '../../../../shared/lib/analytics/create-event-builder',
      ).createEventBuilder,
      trackEvent: mockTrackEvent,
    }),
    mockTrackEvent,
  };
});

const mockTrackEvent = jest.requireMock('../../../hooks/useAnalytics')
  .mockTrackEvent as jest.Mock;

const ledgerWallet = mockState.metamask.accountTree.wallets[
  'keyring:Ledger Hardware'
] as unknown as AccountWalletObject;

const renderTrackAccountRemoved = () =>
  renderHookWithProvider(() => useTrackAccountRemoved(), mockState).result
    .current;

describe('useTrackAccountRemoved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks the removal with the wallet captured before it was removed', () => {
    const trackAccountRemoved = renderTrackAccountRemoved();

    trackAccountRemoved(
      ledgerWallet,
      MetaMetricsAccountRemovedLocation.AccountDetails,
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.AccountRemoved,
      properties: {
        category: MetaMetricsEventCategory.Accounts,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsHardwareWalletDeviceType.Ledger,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_hardware_type: MetaMetricsHardwareWalletDeviceType.Ledger,
        location: MetaMetricsAccountRemovedLocation.AccountDetails,
      },
      sensitiveProperties: {},
    });
  });

  it('reports a MetaMask account when the wallet could not be resolved', () => {
    const trackAccountRemoved = renderTrackAccountRemoved();

    trackAccountRemoved(
      undefined,
      MetaMetricsAccountRemovedLocation.ManageAccounts,
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          category: MetaMetricsEventCategory.Accounts,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: MetaMetricsEventAccountType.Default,
          location: MetaMetricsAccountRemovedLocation.ManageAccounts,
        },
      }),
    );
  });
});
