import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import configureStore from '../../store/store';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useHardwareWalletConfig } from '../../contexts/hardware-wallets';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { HardwareWalletRepair } from './hardware-wallet-repair';
import * as hardwareWalletRepairUtils from './hardware-wallet-repair-utils';
import * as hardwareWalletRepairPageModule from '.';

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

const mockEnsureDeviceReady = jest.fn();
const mockSetConnectionReady = jest.fn();
const mockRequestHardwareWalletPermission = jest.fn();

jest.mock('../../contexts/hardware-wallets', () => ({
  useHardwareWalletActions: () => ({
    ensureDeviceReady: mockEnsureDeviceReady,
    setConnectionReady: mockSetConnectionReady,
    requestHardwareWalletPermission: mockRequestHardwareWalletPermission,
    clearError: jest.fn(),
  }),
  useHardwareWalletState: () => ({
    connectionState: { status: 'disconnected' },
  }),
  useHardwareWalletConfig: jest.fn(),
}));

jest.mock(
  '../../components/multichain/app-header/multichain-meta-fox-logo',
  () => ({
    MultichainMetaFoxLogo: () => <div data-testid="mock-metafox-logo" />,
  }),
);

const memoryRouterFuture = {
  // MemoryRouterProps only exposes this flag after React Router's types split it
  // by router component, but the runtime supports it and it keeps tests quiet.
  ['v7_startTransition' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
  ['v7_relativeSplatPath' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
} as NonNullable<MemoryRouterProps['future']>;

function renderRepairPage(
  walletType: HardwareWalletType | null = HardwareWalletType.Ledger,
  initialEntries = ['/hardware-wallet-repair'],
) {
  (useHardwareWalletConfig as jest.Mock).mockReturnValue({
    walletType,
    isHardwareWalletAccount: true,
  });
  const store = configureStore({ metamask: {} });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries} future={memoryRouterFuture}>
        <HardwareWalletRepair />
      </MemoryRouter>
    </Provider>,
  );
}

describe('HardwareWalletRepair', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useI18nContext as jest.Mock).mockReturnValue((key: string) => {
      const translations: Record<string, string> = {
        close: 'Close',
        connect: 'Connect',
      };

      return translations[key] ?? key;
    });
    jest
      .spyOn(hardwareWalletRepairUtils, 'ensureRepairDeviceReady')
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports the repair page as the default route module export', () => {
    const routeModule =
      hardwareWalletRepairPageModule as typeof hardwareWalletRepairPageModule & {
        default?: unknown;
      };

    expect(routeModule.default).toBe(HardwareWalletRepair);
  });

  it('renders the page title and permissions title', () => {
    const { getByText } = renderRepairPage();
    expect(getByText('hardwareWalletRepairTitle')).toBeInTheDocument();
    expect(
      getByText('hardwareWalletRepairPermissionsTitle'),
    ).toBeInTheDocument();
  });

  it('renders Ledger-specific instructions (3 steps)', () => {
    const { getByText } = renderRepairPage(HardwareWalletType.Ledger);
    expect(getByText(/hardwareWalletRepairStepOneTitle/u)).toBeInTheDocument();
    expect(getByText(/hardwareWalletRepairStepTwoTitle/u)).toBeInTheDocument();
    expect(getByText(/hardwareWalletTitleEthAppNotOpen/u)).toBeInTheDocument();
  });

  it('renders Trezor-specific instructions (2 steps, no ETH app step)', () => {
    const { getByText, queryByText } = renderRepairPage(
      HardwareWalletType.Trezor,
    );
    expect(getByText(/hardwareWalletRepairStepOneTitle/u)).toBeInTheDocument();
    expect(getByText(/hardwareWalletRepairStepTwoTitle/u)).toBeInTheDocument();
    expect(
      queryByText(/hardwareWalletTitleEthAppNotOpen/u),
    ).not.toBeInTheDocument();
  });

  const commonInstructionWalletTypes = [
    HardwareWalletType.OneKey,
    HardwareWalletType.Lattice,
    HardwareWalletType.Qr,
    HardwareWalletType.Unknown,
    null,
  ];

  for (const walletType of commonInstructionWalletTypes) {
    it(`does not render Ledger-specific Ethereum app instructions for ${String(
      walletType,
    )}`, () => {
      const { getByText, queryByText } = renderRepairPage(walletType);
      expect(
        getByText(/hardwareWalletRepairStepOneTitle/u),
      ).toBeInTheDocument();
      expect(
        getByText(/hardwareWalletRepairStepTwoTitle/u),
      ).toBeInTheDocument();
      expect(
        queryByText(/hardwareWalletTitleEthAppNotOpen/u),
      ).not.toBeInTheDocument();
    });
  }

  it('renders instruction descriptions', () => {
    const { getByText } = renderRepairPage();
    expect(
      getByText('hardwareWalletRepairStepOneDescription'),
    ).toBeInTheDocument();
    expect(
      getByText('hardwareWalletRepairStepTwoDescription'),
    ).toBeInTheDocument();
    expect(
      getByText('hardwareWalletEthAppNotOpenDescription'),
    ).toBeInTheDocument();
  });

  it('renders the connect button', () => {
    const { getByRole } = renderRepairPage();
    expect(
      getByRole('button', { name: messages.connect.message }),
    ).toBeInTheDocument();
  });

  it('closes the repair page when the header close button is clicked', () => {
    const closeSpy = jest.spyOn(window, 'close').mockImplementation();
    const { getByTestId } = renderRepairPage();

    fireEvent.click(getByTestId('hardware-wallet-repair-close-header'));

    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.mockRestore();
  });

  it('requests device permission then connects on success', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(true);
    mockEnsureDeviceReady.mockResolvedValue(true);
    const { getByTestId, findByText } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    expect(
      await findByText('hardwareWalletRepairSuccessTitle'),
    ).toBeInTheDocument();
    expect(mockRequestHardwareWalletPermission).toHaveBeenCalledWith(
      HardwareWalletType.Ledger,
    );
    expect(mockEnsureDeviceReady).toHaveBeenCalled();
    expect(
      hardwareWalletRepairUtils.ensureRepairDeviceReady,
    ).not.toHaveBeenCalled();
    expect(mockSetConnectionReady).toHaveBeenCalled();
  });

  it('requests permission using the route wallet type when selected account wallet type is unavailable', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(true);
    mockEnsureDeviceReady.mockResolvedValue(true);
    const { getByTestId, findByText } = renderRepairPage(null, [
      `/hardware-wallet-repair?walletType=${HardwareWalletType.Trezor}`,
    ]);

    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));

    expect(
      await findByText('hardwareWalletRepairSuccessTitle'),
    ).toBeInTheDocument();
    expect(mockRequestHardwareWalletPermission).toHaveBeenCalledWith(
      HardwareWalletType.Trezor,
    );
    expect(mockEnsureDeviceReady).not.toHaveBeenCalled();
    expect(
      hardwareWalletRepairUtils.ensureRepairDeviceReady,
    ).toHaveBeenCalledWith(HardwareWalletType.Trezor);
    expect(mockSetConnectionReady).toHaveBeenCalled();
  });

  it('prefers the route wallet type when selected account wallet type differs', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(true);
    mockEnsureDeviceReady.mockResolvedValue(true);
    const { getByTestId, findByText } = renderRepairPage(
      HardwareWalletType.Ledger,
      [`/hardware-wallet-repair?walletType=${HardwareWalletType.Trezor}`],
    );

    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));

    expect(
      await findByText('hardwareWalletRepairSuccessTitle'),
    ).toBeInTheDocument();
    expect(mockRequestHardwareWalletPermission).toHaveBeenCalledWith(
      HardwareWalletType.Trezor,
    );
    expect(mockEnsureDeviceReady).not.toHaveBeenCalled();
    expect(
      hardwareWalletRepairUtils.ensureRepairDeviceReady,
    ).toHaveBeenCalledWith(HardwareWalletType.Trezor);
  });

  it('shows error when permission is not granted', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(false);
    const { getByTestId, findByText } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    const errorMessage = await findByText(
      'hardwareWalletRepairDeviceNotDetected',
    );
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-error-default');
    expect(mockEnsureDeviceReady).not.toHaveBeenCalled();
  });

  it('shows error when ensureDeviceReady returns false after permission granted', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(true);
    mockEnsureDeviceReady.mockResolvedValue(false);
    const { getByTestId, findByText } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    expect(
      await findByText('hardwareWalletRepairDeviceNotDetected'),
    ).toBeInTheDocument();
  });

  it('shows close button on success state', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(true);
    mockEnsureDeviceReady.mockResolvedValue(true);
    const { getByTestId, findByText } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    await findByText('hardwareWalletRepairSuccessTitle');
    expect(getByTestId('hardware-wallet-repair-close')).toHaveTextContent(
      'Close',
    );
  });

  it('shows error when ensureDeviceReady throws', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(true);
    mockEnsureDeviceReady.mockRejectedValue(
      new Error('test error from device'),
    );
    const { getByTestId, findByText } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    expect(await findByText('test error from device')).toBeInTheDocument();
  });

  it('shows detecting text while connecting', async () => {
    let resolvePermission: (value: boolean) => void;
    mockRequestHardwareWalletPermission.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolvePermission = resolve;
      }),
    );
    const { getByTestId, getByText, queryByText } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    expect(getByText('hardwareWalletRepairDetecting')).toBeInTheDocument();
    await act(async () => {
      resolvePermission(true);
    });
    expect(
      queryByText('hardwareWalletRepairDetecting'),
    ).not.toBeInTheDocument();
  });

  it('disables connect button while connecting', async () => {
    let resolvePermission: (value: boolean) => void;
    mockRequestHardwareWalletPermission.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolvePermission = resolve;
      }),
    );
    const { getByTestId } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    expect(getByTestId('hardware-wallet-repair-reconnect')).toBeDisabled();
    await act(async () => {
      resolvePermission(true);
    });
  });
});
