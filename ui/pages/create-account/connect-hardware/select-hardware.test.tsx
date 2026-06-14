import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { tEn } from '../../../../test/lib/i18n-helpers';
import SelectHardware from './select-hardware';

const mockNavigate = jest.fn();
let mockLocationKey = 'default';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    key: mockLocationKey,
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
}));

jest.mock('../../../../shared/lib/browser-runtime.utils', () => ({
  getBrowserName: () => 'chrome',
}));

describe('SelectHardware', () => {
  const mockConnectToHardwareWallet = jest.fn();

  const render = (browserSupported = true, isFirefox = false) =>
    renderWithProvider(
      <SelectHardware
        connectToHardwareWallet={mockConnectToHardwareWallet}
        browserSupported={browserSupported}
        isFirefox={isFirefox}
      />,
      undefined,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationKey = 'default';
  });

  it('renders all hardware wallet options', () => {
    render();

    expect(
      screen.getByTestId('connect-hardware-wallet-ledger'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('connect-hardware-wallet-keystone'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('connect-hardware-wallet-trezor'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('connect-hardware-wallet-onekey'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('connect-hardware-wallet-lattice'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('connect-hardware-wallet-other-qr'),
    ).toBeInTheDocument();
  });

  it('renders wallet option labels', () => {
    render();

    expect(screen.getByText(tEn('ledger'))).toBeInTheDocument();
    expect(screen.getByText(tEn('keystone'))).toBeInTheDocument();
    expect(screen.getByText(tEn('trezor'))).toBeInTheDocument();
    expect(screen.getByText(tEn('oneKey'))).toBeInTheDocument();
    expect(screen.getByText(tEn('lattice'))).toBeInTheDocument();
    expect(screen.getByText(tEn('otherQrWallet'))).toBeInTheDocument();
  });

  it('renders the page title', () => {
    render();

    expect(screen.getByText(tEn('connectAHardwareWallet'))).toBeInTheDocument();
  });

  it('navigates back when location has a non-default key', () => {
    mockLocationKey = 'abc123';
    render();
    fireEvent.click(screen.getByTestId('hardware-connect-close-btn'));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to choose wallet type page on initial page load', () => {
    mockLocationKey = 'default';
    render();
    fireEvent.click(screen.getByTestId('hardware-connect-close-btn'));

    expect(mockNavigate).toHaveBeenCalledWith('/choose-new-wallet-type', {
      replace: true,
      state: { fromFreshTab: true },
    });
  });

  describe('wallet selection', () => {
    it('connects to Ledger', () => {
      render();
      fireEvent.click(screen.getByTestId('connect-hardware-wallet-ledger'));
      expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
        HardwareDeviceNames.ledger,
      );
    });

    it('connects to Keystone via QR device', () => {
      render();
      fireEvent.click(screen.getByTestId('connect-hardware-wallet-keystone'));
      expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
        HardwareDeviceNames.qr,
      );
    });

    it('connects to Trezor', () => {
      render();
      fireEvent.click(screen.getByTestId('connect-hardware-wallet-trezor'));
      expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
        HardwareDeviceNames.trezor,
      );
    });

    it('connects to OneKey via QR device onboarding flow', () => {
      render();
      fireEvent.click(screen.getByTestId('connect-hardware-wallet-onekey'));
      expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
        HardwareDeviceNames.qr,
      );
    });

    it('connects to Lattice', () => {
      render();
      fireEvent.click(screen.getByTestId('connect-hardware-wallet-lattice'));
      expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
        HardwareDeviceNames.lattice,
      );
    });

    it('connects to Other QR wallet via QR device', () => {
      render();
      fireEvent.click(screen.getByTestId('connect-hardware-wallet-other-qr'));
      expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
        HardwareDeviceNames.qr,
      );
    });
  });

  describe('unsupported browser', () => {
    it('shows unsupported browser message', () => {
      render(false);

      expect(screen.getByText(tEn('browserNotSupported'))).toBeInTheDocument();
    });

    it('does not render wallet options', () => {
      render(false);

      expect(
        screen.queryByTestId('connect-hardware-wallet-ledger'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Firefox Ledger warning', () => {
    it('shows warning when clicking Ledger on Firefox', () => {
      render(true, true);

      fireEvent.click(screen.getByTestId('connect-hardware-wallet-ledger'));

      expect(
        screen.getByText(tEn('ledgerFirefoxNotSupportedTitle')),
      ).toBeInTheDocument();
      expect(mockConnectToHardwareWallet).not.toHaveBeenCalled();
    });

    it('dismisses warning when clicking a non-Ledger wallet', () => {
      render(true, true);

      fireEvent.click(screen.getByTestId('connect-hardware-wallet-ledger'));
      expect(
        screen.getByText(tEn('ledgerFirefoxNotSupportedTitle')),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('connect-hardware-wallet-trezor'));
      expect(
        screen.queryByText(tEn('ledgerFirefoxNotSupportedTitle')),
      ).not.toBeInTheDocument();
    });

    it('does not show warning when clicking Ledger on non-Firefox', () => {
      render(true, false);

      fireEvent.click(screen.getByTestId('connect-hardware-wallet-ledger'));

      expect(
        screen.queryByText(tEn('ledgerFirefoxNotSupportedTitle')),
      ).not.toBeInTheDocument();
      expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
        HardwareDeviceNames.ledger,
      );
    });
  });

  // Note: isUSBSupported is always false in test environment (process.env.IN_TEST = true),
  // so the USB requestDevice branch is not exercised. These tests verify that
  // Trezor connection still succeeds regardless of USB mock state.
  describe('Trezor USB flow', () => {
    const originalUsb = window.navigator.usb;

    beforeEach(() => {
      Object.defineProperty(window.navigator, 'usb', {
        value: {
          requestDevice: jest.fn().mockResolvedValue({}),
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window.navigator, 'usb', {
        value: originalUsb,
        writable: true,
        configurable: true,
      });
    });

    it('connects Trezor when USB is available', async () => {
      render();

      fireEvent.click(screen.getByTestId('connect-hardware-wallet-trezor'));

      await waitFor(() => {
        expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
          HardwareDeviceNames.trezor,
        );
      });
    });

    it('still connects when user cancels USB device selection', async () => {
      (window.navigator.usb.requestDevice as jest.Mock).mockRejectedValue(
        new Error('No device selected'),
      );

      render();

      fireEvent.click(screen.getByTestId('connect-hardware-wallet-trezor'));

      await waitFor(() => {
        expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
          HardwareDeviceNames.trezor,
        );
      });
    });
  });
});
