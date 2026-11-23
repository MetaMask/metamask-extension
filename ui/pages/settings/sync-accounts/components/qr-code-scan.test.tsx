import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { ENVIRONMENT } from '../../../../../shared/constants/build';
import { selectQrSyncQrPayload } from '../../../../selectors/qr-sync/qr-sync';
import QrCodeScan from './qr-code-scan';

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({
    value,
    className,
    size,
  }: {
    value: string;
    className?: string;
    size: number;
  }) => (
    <svg
      data-testid="qr-code-image"
      data-value={value}
      data-size={size}
      className={className}
    />
  ),
}));

jest.mock('../../../../selectors/qr-sync/qr-sync', () => ({
  ...jest.requireActual('../../../../selectors/qr-sync/qr-sync'),
  selectQrSyncQrPayload: jest.fn(),
}));

const mockSelectQrSyncQrPayload = jest.mocked(selectQrSyncQrPayload);

const createMockStore = (metamaskOverrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      qrSyncQrPayload: 'metamask://connect/mwp?p=test',
      qrSyncError: null,
      ...metamaskOverrides,
    },
  });

const renderQrCodeScan = (mockStore = createMockStore()) =>
  renderWithProvider(<QrCodeScan />, mockStore);

describe('QrCodeScan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectQrSyncQrPayload.mockImplementation(
      (state) => state.metamask.qrSyncQrPayload,
    );
  });

  it('renders the heading, description and QR code image', () => {
    const mockStore = createMockStore();
    renderQrCodeScan(mockStore);

    expect(screen.getByText(messages.syncAccounts.message)).toBeInTheDocument();
    expect(
      screen.getByText(messages.scan_qr_code_desc.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-image')).toHaveAttribute(
      'data-size',
      '152',
    );
  });

  it('reveals the QR payload on request in development', () => {
    const originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

    try {
      renderQrCodeScan();

      expect(
        screen.queryByTestId('qr-sync-qr-payload'),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('qr-sync-toggle-qr-payload'));

      const payload = screen.getByTestId('qr-sync-qr-payload');
      expect(payload).toHaveTextContent('metamask://connect/mwp?p=test');
    } finally {
      process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
    }
  });

  it('reveals the QR payload on request in test builds', () => {
    const originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;

    try {
      renderQrCodeScan();

      fireEvent.click(screen.getByTestId('qr-sync-toggle-qr-payload'));

      expect(screen.getByTestId('qr-sync-qr-payload')).toHaveTextContent(
        'metamask://connect/mwp?p=test',
      );
    } finally {
      process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
    }
  });

  it('does not render the QR payload in production', () => {
    const originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;

    try {
      renderQrCodeScan();

      expect(
        screen.queryByTestId('qr-sync-qr-payload'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('qr-sync-toggle-qr-payload'),
      ).not.toBeInTheDocument();
    } finally {
      process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
    }
  });

  it('uses the white bordered QR surface', () => {
    renderQrCodeScan();

    const qrCode = screen.getByTestId('qr-code-image');
    expect(qrCode.parentElement).toHaveClass(
      'bg-white',
      'border',
      'border-muted',
      'p-4',
    );
  });

  it('uses a white background around the centered fox', () => {
    renderQrCodeScan();

    const fox = screen.getByTestId('qr-code-fox');

    expect(fox).toHaveClass('h-[35px]', 'w-[35px]', 'object-contain');
    expect(fox.parentElement).toHaveClass('h-10', 'w-[45px]', 'bg-white');
  });

  it('shows a loading state when the next QR payload is being created', () => {
    mockSelectQrSyncQrPayload.mockReturnValue(null);
    renderQrCodeScan();

    expect(screen.getByTestId('qr-sync-qr-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-code-image')).not.toBeInTheDocument();
  });
});
