import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
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
import {
  CROSS_CHAIN_SWAP_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
} from '../../../helpers/constants/routes';
import { I18nProvider } from '../../../../test/lib/render-helpers';
import { enLocale as en } from '../../../../test/lib/i18n-helpers';
import QRHardwarePopover from './qr-hardware-popover';

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

let mockPathname = '/';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: mockPathname }),
}));

jest.mock('./qr-hardware-wallet-importer', () => {
  const Mock = (props: {
    setErrorTitle: (title: string) => void;
    setErrorActive: (active: boolean) => void;
  }) => (
    <div data-testid="qr-hardware-wallet-importer">
      <button
        data-testid="importer-set-error-title"
        onClick={() => props.setErrorTitle('Importer Error')}
      />
      <button
        data-testid="importer-clear-error-title"
        onClick={() => props.setErrorTitle('')}
      />
      <button
        data-testid="importer-set-error-active"
        onClick={() => props.setErrorActive(true)}
      />
      <button
        data-testid="importer-clear-error-active"
        onClick={() => props.setErrorActive(false)}
      />
    </div>
  );
  Mock.displayName = 'QRHardwareWalletImporter';
  return Mock;
});

jest.mock('./qr-hardware-sign-request', () => {
  const Mock = (props: {
    setErrorTitle: (title: string) => void;
    setErrorActive: (active: boolean) => void;
  }) => (
    <div data-testid="qr-hardware-sign-request">
      <button
        data-testid="sign-set-error-title"
        onClick={() => props.setErrorTitle('Sign Error')}
      />
      <button
        data-testid="sign-clear-error-title"
        onClick={() => props.setErrorTitle('')}
      />
      <button
        data-testid="sign-set-error-active"
        onClick={() => props.setErrorActive(true)}
      />
      <button
        data-testid="sign-clear-error-active"
        onClick={() => props.setErrorActive(false)}
      />
    </div>
  );
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
    mockPathname = '/';
  });

  it('renders nothing when there is no active scan request', () => {
    const { container } = renderPopover(buildStore(null));
    expect(container.firstChild).toBeNull();
  });

  it('renders the PAIR popover with the wallet importer title', () => {
    renderPopover(buildStore({ type: QrScanRequestType.PAIR }));
    expect(
      screen.getByTestId('qr-hardware-wallet-importer'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(en.QRHardwareWalletImporterTitle.message),
    ).toBeInTheDocument();
  });

  it('renders the SIGN popover with the sign request title', () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(screen.getByTestId('qr-hardware-sign-request')).toBeInTheDocument();
    expect(
      screen.getByText(en.QRHardwareSignRequestTitle.message),
    ).toBeInTheDocument();
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

  it('does not render the SIGN popover on the bridge hardware wallet signing page', () => {
    mockPathname = `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`;

    const { container } = renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('title behavior', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    mockPathname = '/';
  });

  it('displays errorTitle when child sets it, overriding the flow title', async () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );
    expect(
      screen.getByText(en.QRHardwareSignRequestTitle.message),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('sign-set-error-title'));

    expect(screen.getByText('Sign Error')).toBeInTheDocument();
    expect(
      screen.queryByText(en.QRHardwareSignRequestTitle.message),
    ).not.toBeInTheDocument();
  });

  it('restores the flow title when errorTitle is cleared', async () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );

    await userEvent.click(screen.getByTestId('sign-set-error-title'));
    expect(screen.getByText('Sign Error')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('sign-clear-error-title'));
    expect(
      screen.getByText(en.QRHardwareSignRequestTitle.message),
    ).toBeInTheDocument();
    expect(screen.queryByText('Sign Error')).not.toBeInTheDocument();
  });

  it('hides the flow title when errorActive is true', async () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.PAIR,
      }),
    );
    expect(
      screen.getByText(en.QRHardwareWalletImporterTitle.message),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('importer-set-error-active'));

    expect(
      screen.queryByText(en.QRHardwareWalletImporterTitle.message),
    ).not.toBeInTheDocument();
  });

  it('restores the flow title when errorActive is cleared', async () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.PAIR,
      }),
    );

    await userEvent.click(screen.getByTestId('importer-set-error-active'));
    expect(
      screen.queryByText(en.QRHardwareWalletImporterTitle.message),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('importer-clear-error-active'));
    expect(
      screen.getByText(en.QRHardwareWalletImporterTitle.message),
    ).toBeInTheDocument();
  });

  it('keeps the close button on the right when the title is hidden', async () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );

    await userEvent.click(screen.getByTestId('sign-set-error-active'));

    const closeButton = screen.getByRole('button', { name: /close/iu });
    const header = closeButton.closest('.mm-header-base');
    expect(header).not.toBeNull();
    expect(header?.children.length).toBeGreaterThanOrEqual(2);
    expect(header?.lastElementChild?.contains(closeButton)).toBe(true);
  });

  it('prioritizes errorTitle over errorActive suppression', async () => {
    renderPopover(
      buildStore({
        type: QrScanRequestType.SIGN,
        request: { requestId: 'req-1', payload: {} },
      }),
    );

    await userEvent.click(screen.getByTestId('sign-set-error-active'));
    await userEvent.click(screen.getByTestId('sign-set-error-title'));

    expect(screen.getByText('Sign Error')).toBeInTheDocument();
  });
});
