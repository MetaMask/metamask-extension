import { type AccountGroupId } from '@metamask/account-api';
import { cloneDeep } from 'lodash';
import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  MetaMetricsAccountHiddenLocation,
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
} from '../../../../shared/constants/metametrics';
import { useTrackAccountHidden } from './useTrackAccountHidden';

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

const entropyWalletId = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ';
const entropyGroupId = `${entropyWalletId}/0` as AccountGroupId;
const secondEntropyWalletId = 'entropy:01JKAF3PJ247KAM6C03G5Q0NP8';
const secondEntropyGroupId = `${secondEntropyWalletId}/0` as AccountGroupId;
const ledgerWalletId = 'keyring:Ledger Hardware';
const ledgerGroupId =
  `${ledgerWalletId}/0xc42edfcc21ed14dda456aa0756c153f7985d8813` as AccountGroupId;

/**
 * Builds the default mock state with the given account groups stored as
 * hidden, as they would be once a hide has been written.
 *
 * @param hiddenGroups - Wallet and group IDs of the groups to mark hidden.
 * @returns The mock state.
 */
const stateWithHiddenGroups = (
  hiddenGroups: [walletId: string, groupId: AccountGroupId][],
) => {
  const state = cloneDeep(mockState);
  const wallets = state.metamask.accountTree.wallets as Record<
    string,
    { groups: Record<string, { metadata: { hidden: boolean } }> }
  >;
  for (const [walletId, groupId] of hiddenGroups) {
    wallets[walletId].groups[groupId].metadata.hidden = true;
  }
  return state;
};

const renderTrackAccountHidden = (state: object) =>
  renderHookWithProvider(() => useTrackAccountHidden(), state).result.current;

describe('useTrackAccountHidden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks a hide with the hidden total across the whole tree', () => {
    const trackAccountHidden = renderTrackAccountHidden(
      stateWithHiddenGroups([
        [entropyWalletId, entropyGroupId],
        [secondEntropyWalletId, secondEntropyGroupId],
      ]),
    );

    trackAccountHidden(
      entropyGroupId,
      true,
      MetaMetricsAccountHiddenLocation.ManageAccounts,
    );

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: MetaMetricsEventName.AccountHidden,
      properties: {
        category: MetaMetricsEventCategory.Accounts,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Default,
        hidden: true,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hidden_count_after: 2,
        location: MetaMetricsAccountHiddenLocation.ManageAccounts,
      },
      sensitiveProperties: {},
    });
  });

  it('tracks a reveal once the stored value is visible', () => {
    const trackAccountHidden = renderTrackAccountHidden(mockState);

    trackAccountHidden(
      entropyGroupId,
      false,
      MetaMetricsAccountHiddenLocation.AccountMenu,
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          hidden: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hidden_count_after: 0,
          location: MetaMetricsAccountHiddenLocation.AccountMenu,
        }),
      }),
    );
  });

  it('resolves the account type from the wallet in the store', () => {
    const trackAccountHidden = renderTrackAccountHidden(
      stateWithHiddenGroups([[ledgerWalletId, ledgerGroupId]]),
    );

    trackAccountHidden(
      ledgerGroupId,
      true,
      MetaMetricsAccountHiddenLocation.AccountMenu,
    );

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: MetaMetricsHardwareWalletDeviceType.Ledger,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_hardware_type: MetaMetricsHardwareWalletDeviceType.Ledger,
        }),
      }),
    );
  });

  it('does not track a hide that did not reach the store', () => {
    // `setAccountGroupHidden` logs and swallows background errors, so a failed
    // write still resolves and leaves the stored value unchanged.
    const trackAccountHidden = renderTrackAccountHidden(mockState);

    trackAccountHidden(
      entropyGroupId,
      true,
      MetaMetricsAccountHiddenLocation.ManageAccounts,
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does not track an account group that is not in the tree', () => {
    const trackAccountHidden = renderTrackAccountHidden(mockState);

    trackAccountHidden(
      'entropy:unknown/0' as AccountGroupId,
      false,
      MetaMetricsAccountHiddenLocation.ManageAccounts,
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
