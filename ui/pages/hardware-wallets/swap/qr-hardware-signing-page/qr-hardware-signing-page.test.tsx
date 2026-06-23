import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  createMemoryRouterWrapper,
  en,
  I18nProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import { QrHardwareSigningPhase } from './qr-hardware-signing-page.types';
import QrHardwareSigningPage from '.';

function renderQrHardwareSigningPage(
  props: React.ComponentProps<typeof QrHardwareSigningPage>,
) {
  const RouterWrapper = createMemoryRouterWrapper();

  return render(
    <RouterWrapper>
      <I18nProvider currentLocale="en" current={en} en={en}>
        <QrHardwareSigningPage {...props} />
      </I18nProvider>
    </RouterWrapper>,
  );
}

jest.mock('../../../../components/app/qr-hardware-popover/qr-hardware-sign-request/qr-reader', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => <div data-testid="qr-reader-mock" />),
}));

jest.mock('../qr-signature-code', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(() => <div data-testid="qr-signature-code-mock" />),
}));

const defaultProps = {
  title: 'Step 2 of 4: Scan the QR code shown on your wallet',
  phase: QrHardwareSigningPhase.DisplayQrCode,
  payload: {
    type: 'eth-sign-request',
    cbor: 'a201010203',
  },
  requestId: 'sign-request-id',
  onBack: jest.fn(),
  onCancel: jest.fn(),
  onContinueToScan: jest.fn(),
  onScanSuccess: jest.fn(),
};

describe('QrHardwareSigningPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title and animated QR code in display mode', () => {
    renderQrHardwareSigningPage(defaultProps);

    expect(screen.getByTestId('qr-hardware-signing-page__title')).toHaveTextContent(
      defaultProps.title,
    );
    expect(screen.getByTestId('qr-signature-code-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-reader-mock')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('qr-hardware-signing-page__continue-button'),
    ).toHaveTextContent("I've signed, scan signature");
  });

  it('renders the scanner in scan mode', () => {
    renderQrHardwareSigningPage({
      ...defaultProps,
      phase: QrHardwareSigningPhase.ScanSignature,
      title: 'Last step: Scan the QR code shown on your wallet',
    });

    expect(screen.getByTestId('qr-reader-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-signature-code-mock')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('qr-hardware-signing-page__continue-button'),
    ).not.toBeInTheDocument();
  });

  it('calls the expected handlers from footer and header actions', () => {
    renderQrHardwareSigningPage(defaultProps);

    fireEvent.click(screen.getByTestId('qr-hardware-signing-page__back-button'));
    fireEvent.click(screen.getByTestId('qr-hardware-signing-page__continue-button'));
    fireEvent.click(screen.getByTestId('qr-hardware-signing-page__cancel-button'));

    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    expect(defaultProps.onContinueToScan).toHaveBeenCalledTimes(1);
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
