import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from '../../store/store';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../contexts/hardware-wallets';
import { HardwareWalletType } from '../../contexts/hardware-wallets/types';
import { HardwareWalletRepair } from './hardware-wallet-repair';

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

jest.mock('../../components/multichain/app-header/multichain-meta-fox-logo', () => ({
  MultichainMetaFoxLogo: () => <div data-testid="mock-metafox-logo" />,
}));

function renderRepairPage(
  walletType: HardwareWalletType = HardwareWalletType.Ledger,
) {
  (useHardwareWalletConfig as jest.Mock).mockReturnValue({
    walletType,
    isHardwareWalletAccount: true,
  });
  const store = configureStore({ metamask: {} });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <HardwareWalletRepair />
      </MemoryRouter>
    </Provider>,
  );
}

describe('HardwareWalletRepair', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useI18nContext as jest.Mock).mockReturnValue((key: string) => key);
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
    expect(
      getByText(/hardwareWalletRepairStepThreeTitle/u),
    ).toBeInTheDocument();
  });

  it('renders Trezor-specific instructions (2 steps, no ETH app step)', () => {
    const { getByText, queryByText } = renderRepairPage(
      HardwareWalletType.Trezor,
    );
    expect(getByText(/hardwareWalletRepairStepOneTitle/u)).toBeInTheDocument();
    expect(getByText(/hardwareWalletRepairStepTwoTitle/u)).toBeInTheDocument();
    expect(
      queryByText(/hardwareWalletRepairStepThreeTitle/u),
    ).not.toBeInTheDocument();
  });

  it('renders instruction descriptions', () => {
    const { getByText } = renderRepairPage();
    expect(
      getByText('hardwareWalletRepairStepOneDescription'),
    ).toBeInTheDocument();
    expect(
      getByText('hardwareWalletRepairStepTwoDescription'),
    ).toBeInTheDocument();
  });

  it('renders the connect button', () => {
    const { getByTestId } = renderRepairPage();
    expect(
      getByTestId('hardware-wallet-repair-reconnect'),
    ).toBeInTheDocument();
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
    expect(mockSetConnectionReady).toHaveBeenCalled();
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
    expect(
      getByTestId('hardware-wallet-repair-close'),
    ).toBeInTheDocument();
  });

  it('shows error when ensureDeviceReady throws', async () => {
    mockRequestHardwareWalletPermission.mockResolvedValue(true);
    mockEnsureDeviceReady.mockRejectedValue(new Error('test error from device'));
    const { getByTestId, findByText } = renderRepairPage();
    fireEvent.click(getByTestId('hardware-wallet-repair-reconnect'));
    expect(
      await findByText('test error from device'),
    ).toBeInTheDocument();
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
      resolvePermission(true as never);
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
      resolvePermission(true as never);
    });
  });
});
