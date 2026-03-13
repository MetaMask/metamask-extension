import React from 'react';
import { screen } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import QRHardwarePopover from './qr-hardware-popover';

jest.mock('../../../../app/scripts/lib/util', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('./qr-hardware-wallet-importer', () => {
  const Mock = () => <div data-testid="qr-hardware-wallet-importer" />;
  Mock.displayName = 'QRHardwareWalletImporter';
  return Mock;
});

jest.mock('./qr-hardware-sign-request', () => {
  const Mock = () => <div data-testid="qr-hardware-sign-request" />;
  Mock.displayName = 'QRHardwareSignRequest';
  return Mock;
});

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);

function buildStore(activeQrCodeScanRequest = null) {
  return configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      activeQrCodeScanRequest,
    },
    confirmTransaction: {
      txData: { id: 'mock-tx-id' },
    },
  });
}

describe('QRHardwarePopover', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
  });

  it('renders nothing when there is no active scan request', () => {
    const { container } = renderWithProvider(
      <QRHardwarePopover />,
      buildStore(null),
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the PAIR popover in fullscreen mode', () => {
    renderWithProvider(
      <QRHardwarePopover />,
      buildStore({ type: QrScanRequestType.PAIR }),
    );
    expect(
      screen.getByTestId('qr-hardware-wallet-importer'),
    ).toBeInTheDocument();
  });

  it('renders the SIGN popover in fullscreen mode', () => {
    renderWithProvider(
      <QRHardwarePopover />,
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(screen.getByTestId('qr-hardware-sign-request')).toBeInTheDocument();
  });

  it('does not render the PAIR popover in sidepanel mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    const { container } = renderWithProvider(
      <QRHardwarePopover />,
      buildStore({ type: QrScanRequestType.PAIR }),
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render the PAIR popover in popup mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    const { container } = renderWithProvider(
      <QRHardwarePopover />,
      buildStore({ type: QrScanRequestType.PAIR }),
    );
    expect(container.firstChild).toBeNull();
  });

  it('still renders the SIGN popover in sidepanel mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    renderWithProvider(
      <QRHardwarePopover />,
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(screen.getByTestId('qr-hardware-sign-request')).toBeInTheDocument();
  });

  it('still renders the SIGN popover in popup mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    renderWithProvider(
      <QRHardwarePopover />,
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(screen.getByTestId('qr-hardware-sign-request')).toBeInTheDocument();
  });
});
