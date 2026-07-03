import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../stub/networks';
import type {
  HardwareConnectAccount,
  RawHardwareAccount,
} from '../../../../ui/pages/create-account/connect-hardware/types';
import type { SelectHardwareAccountsPageProps } from '../../../../ui/pages/create-account/connect-hardware/select-hardware-accounts-page/select-hardware-accounts-page.types';
import {
  LEDGER_HD_PATHS,
  TREZOR_HD_PATHS,
} from '../../../../ui/pages/create-account/connect-hardware/utils/hardware-hd-paths';
import {
  createMockRawHardwareAccounts,
  MOCK_RAW_HARDWARE_ACCOUNTS,
} from './raw-hardware-accounts';

export { createMockRawHardwareAccounts, MOCK_RAW_HARDWARE_ACCOUNTS };

/**
 * Maps raw hardware accounts to connect-hardware page props shape.
 * @param accounts
 */
export function toHardwareConnectAccounts(
  accounts: RawHardwareAccount[],
): HardwareConnectAccount[] {
  return accounts.map((account) => ({
    ...account,
    balance: '...',
  }));
}

/** Redux state used by SelectHardwareAccountsPage unit tests. */
export function createSelectHardwareAccountsMockState() {
  return {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      internalAccounts: {
        accounts: {},
        selectedAccount: 'accountId',
      },
      keyrings: [],
    },
    appState: {
      defaultHdPaths: {
        [HardwareDeviceNames.ledger]: LEDGER_HD_PATHS[0].value,
        [HardwareDeviceNames.trezor]: TREZOR_HD_PATHS[0].value,
        [HardwareDeviceNames.qr]: LEDGER_HD_PATHS[0].value,
      },
    },
  };
}

export function createSelectHardwareAccountsMockStore() {
  return configureMockStore([thunk])(createSelectHardwareAccountsMockState());
}

export function createDefaultSelectHardwareAccountsPageProps(
  overrides: Partial<SelectHardwareAccountsPageProps> = {},
): SelectHardwareAccountsPageProps {
  return {
    device: HardwareDeviceNames.ledger,
    accounts: toHardwareConnectAccounts(MOCK_RAW_HARDWARE_ACCOUNTS.slice(0, 2)),
    connectedAccounts: [],
    onBack: jest.fn(),
    onError: jest.fn(),
    ...overrides,
  };
}

export function createMockMetaMetricsContext() {
  const mockTrackEvent = jest.fn();
  return {
    context: {
      trackEvent: mockTrackEvent,
      bufferedTrace: jest.fn(),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    },
    mockTrackEvent,
  };
}
