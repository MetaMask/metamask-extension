import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { I18nProvider } from '../../../../test/lib/render-helpers';
import { enLocale as en } from '../../../../test/lib/i18n-helpers';
import QRHardwarePopover from './qr-hardware-popover';

jest.mock('../../../../shared/lib/environment-type', () => ({
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

function buildStore(
  activeQrCodeScanRequest: { type: string; request?: object } | null = null,
) {
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

function renderPopover(store: ReturnType<typeof buildStore>) {
  return render(
    <Provider store={store}>
      <I18nProvider currentLocale="en" current={en} en={en}>
        <QRHardwarePopover />
      </I18nProvider>
    </Provider>,
  );
}

describe('QRHardwarePopover', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
  });

  it('renders nothing when there is no active scan request', () => {
    const { container } = renderPopover(buildStore(null));
    expect(container.firstChild).toBeNull();
  });

  it('renders the PAIR popover in fullscreen mode', () => {
    renderPopover(buildStore({ type: QrScanRequestType.PAIR }));
    expect(
      screen.getByTestId('qr-hardware-wallet-importer'),
    ).toBeInTheDocument();
  });

  it('renders the SIGN popover in fullscreen mode', () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(screen.getByTestId('qr-hardware-sign-request')).toBeInTheDocument();
  });

  it('does not render the PAIR popover in sidepanel mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    const { container } = renderPopover(
      buildStore({ type: QrScanRequestType.PAIR }),
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render the PAIR popover in popup mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    const { container } = renderPopover(
      buildStore({ type: QrScanRequestType.PAIR }),
    );
    expect(container.firstChild).toBeNull();
  });

  it('still renders the SIGN popover in sidepanel mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(screen.getByTestId('qr-hardware-sign-request')).toBeInTheDocument();
  });

  it('still renders the SIGN popover in popup mode', () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(screen.getByTestId('qr-hardware-sign-request')).toBeInTheDocument();
  });
});
