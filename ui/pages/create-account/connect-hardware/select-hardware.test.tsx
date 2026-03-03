import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import {
  HardwareAffiliateLinks,
  HardwareAffiliateTutorialLinks,
  HardwareDeviceNames,
} from '../../../../shared/constants/hardware-wallets';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { openWindow } from '../../../helpers/utils/window';
import SelectHardware from './select-hardware';

jest.mock('../../../helpers/utils/window', () => ({
  openWindow: jest.fn(),
}));

jest.mock('../../../../shared/modules/browser-runtime.utils', () => ({
  getBrowserName: () => 'chrome',
}));

describe('SelectHardware', () => {
  const mockOnCancel = jest.fn();
  const mockConnectToHardwareWallet = jest.fn();

  const render = (browserSupported = true, ledgerTransportType?: 'live') =>
    renderWithProvider(
      <SelectHardware
        onCancel={mockOnCancel}
        connectToHardwareWallet={mockConnectToHardwareWallet}
        browserSupported={browserSupported}
        ledgerTransportType={ledgerTransportType}
      />,
      undefined,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.platform = {
      openTab: jest.fn(),
    } as unknown as typeof global.platform;
  });

  it('disables continue button when no device is selected', () => {
    render();

    expect(
      screen.getByRole('button', { name: messages.continue.message }),
    ).toBeDisabled();
  });

  it('calls connectToHardwareWallet when ledger is selected and continue is clicked', () => {
    render();

    fireEvent.click(screen.getByLabelText(messages.ledger.message));
    fireEvent.click(
      screen.getByRole('button', { name: messages.continue.message }),
    );

    expect(mockConnectToHardwareWallet).toHaveBeenCalledTimes(1);
    expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
      HardwareDeviceNames.ledger,
    );
  });

  it('calls onCancel when close button is clicked', () => {
    render();

    fireEvent.click(screen.getByTestId('hardware-connect-close-btn'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls connectToHardwareWallet when trezor is selected and continue is clicked', () => {
    render();

    fireEvent.click(screen.getByLabelText(messages.trezor.message));
    fireEvent.click(
      screen.getByRole('button', { name: messages.continue.message }),
    );

    expect(mockConnectToHardwareWallet).toHaveBeenCalledTimes(1);
    expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
      HardwareDeviceNames.trezor,
    );
  });

  it('calls connectToHardwareWallet when qr is selected and continue is clicked', () => {
    render();

    fireEvent.click(screen.getByLabelText('QRCode'));
    fireEvent.click(
      screen.getByRole('button', { name: messages.continue.message }),
    );

    expect(mockConnectToHardwareWallet).toHaveBeenCalledTimes(1);
    expect(mockConnectToHardwareWallet).toHaveBeenCalledWith(
      HardwareDeviceNames.qr,
    );
  });

  it('opens ledger marketing links when ledger is selected', () => {
    render();

    fireEvent.click(screen.getByLabelText(messages.ledger.message));
    fireEvent.click(
      screen.getByRole('button', { name: messages.buyNow.message }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: messages.tutorial.message }),
    );

    expect(openWindow).toHaveBeenNthCalledWith(
      1,
      HardwareAffiliateLinks.Ledger,
    );
    expect(openWindow).toHaveBeenNthCalledWith(
      2,
      HardwareAffiliateTutorialLinks.Ledger,
    );
    expect(openWindow).toHaveBeenCalledTimes(2);
  });

  it('renders Ledger Live setup step for live transport', () => {
    render(true, 'live');

    fireEvent.click(screen.getByLabelText(messages.ledger.message));

    expect(
      screen.getByText(messages.step1LedgerWallet.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.step2LedgerWallet.message),
    ).toBeInTheDocument();
  });

  it('renders unsupported browser screen and opens Chrome download link', () => {
    render(false);

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.downloadGoogleChrome.message,
      }),
    );

    expect(global.platform.openTab).toHaveBeenCalledTimes(1);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://google.com/chrome',
    });
  });

  it('opens Ngrave marketing links when QR device is selected', () => {
    render();

    fireEvent.click(screen.getByLabelText('QRCode'));
    fireEvent.click(screen.getByTestId('ngrave-brand-buy-now-btn'));
    fireEvent.click(screen.getByTestId('ngrave-brand-learn-more-btn'));

    expect(openWindow).toHaveBeenNthCalledWith(
      1,
      HardwareAffiliateLinks.Ngrave,
    );
    expect(openWindow).toHaveBeenCalledTimes(2);
  });
});
