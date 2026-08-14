import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { KeyringTypes } from '@metamask/keyring-controller';
import configureStore from '../../store/store';
import { useI18nContext } from '../../hooks/useI18nContext';
import { HardwareWalletErrorProvider } from '../../contexts/hardware-wallets';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';
import { HardwareWalletRepair } from './hardware-wallet-repair';

const memoryRouterFuture = {
  // MemoryRouterProps only exposes this flag after React Router's types split it
  // by router component, but the runtime supports it and it keeps tests quiet.
  ['v7_startTransition' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
  ['v7_relativeSplatPath' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
} as NonNullable<MemoryRouterProps['future']>;

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock(
  '../../components/multichain/app-header/multichain-meta-fox-logo',
  () => ({
    MultichainMetaFoxLogo: () => <div data-testid="mock-metafox-logo" />,
  }),
);

jest.mock('../../contexts/hardware-wallets/webConnectionUtils', () => ({
  isWebHidAvailable: jest.fn().mockReturnValue(false),
  isWebUsbAvailable: jest.fn().mockReturnValue(false),
}));

// Intentionally keep useHardwareWalletConfig and useHardwareWalletActions real.
// This test covers the provider plumbing that the sibling component test mocks.
jest.mock(
  '../../contexts/hardware-wallets/HardwareWalletEventHandlers',
  () => ({
    useDeviceEventHandlers: jest.fn().mockReturnValue({
      updateConnectionState: jest.fn(),
      handleDeviceEvent: jest.fn(),
      handleDisconnect: jest.fn(),
    }),
  }),
);

jest.mock(
  '../../contexts/hardware-wallets/useHardwareWalletPermissions',
  () => {
    const { HardwareConnectionPermissionState } = jest.requireActual(
      '../../contexts/hardware-wallets/types',
    );

    return {
      useHardwareWalletPermissions: jest.fn().mockReturnValue({
        checkHardwareWalletPermissionAction: jest
          .fn()
          .mockResolvedValue(HardwareConnectionPermissionState.Unknown),
        requestHardwareWalletPermissionAction: jest
          .fn()
          .mockResolvedValue(false),
      }),
    };
  },
);

jest.mock(
  '../../contexts/hardware-wallets/useHardwareWalletConnection',
  () => ({
    useHardwareWalletConnection: jest.fn().mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
      ensureDeviceReady: jest.fn().mockResolvedValue(true),
    }),
  }),
);

jest.mock(
  '../../contexts/hardware-wallets/useHardwareWalletAutoConnect',
  () => ({
    useHardwareWalletAutoConnect: jest.fn(),
  }),
);

function renderRepairPageWithProvider(
  initialEntries = ['/hardware-wallet-repair'],
) {
  const store = configureStore({
    metamask: {
      internalAccounts: {
        accounts: {
          'account-1': {
            id: 'account-1',
            address: '0x123',
            metadata: {
              keyring: {
                type: KeyringTypes.ledger,
              },
            },
          },
        },
        selectedAccount: 'account-1',
      },
    },
    appState: {
      modal: {
        modalState: {
          name: null,
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries} future={memoryRouterFuture}>
        <HardwareWalletErrorProvider>
          <HardwareWalletRepair />
        </HardwareWalletErrorProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe('HardwareWalletRepair provider integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useI18nContext as jest.Mock).mockReturnValue((key: string) => key);
  });

  it('renders through the app-level hardware wallet provider boundary', () => {
    const { getByTestId } = renderRepairPageWithProvider();

    expect(getByTestId('hardware-wallet-repair')).toBeInTheDocument();
  });

  it('propagates the selected Ledger account through the provider', () => {
    const { getByText } = renderRepairPageWithProvider();

    expect(getByText(/hardwareWalletTitleEthAppNotOpen/u)).toBeInTheDocument();
  });

  it('uses the route wallet type instead of the selected account wallet type on the repair route', () => {
    const { queryByText } = renderRepairPageWithProvider([
      `/hardware-wallet-repair?walletType=${HardwareWalletType.Trezor}`,
    ]);

    expect(
      queryByText(/hardwareWalletTitleEthAppNotOpen/u),
    ).not.toBeInTheDocument();
  });
});
