import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import {
  enLocale as messages,
  tEn,
} from '../../../../../test/lib/i18n-helpers';
import { QrErrorContent } from './qr-error-content';
import {
  QrErrorType,
  QrErrorFlowContext,
  QR_ERROR_LEARN_MORE_URL,
} from './qr-error-content.types';

describe('QrErrorContent', () => {
  const openTabMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error mocking platform
    globalThis.platform = { openTab: openTabMock };
  });

  it('renders the correct root test-id, title, and body for a given variant', () => {
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.NonUrQrCode}
        flowContext={QrErrorFlowContext.Pairing}
        onTryAgain={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('qr-error-nonUrQrCode-pairing'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.qrErrorNonUrPairingTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.qrErrorNonUrPairingBody.message),
    ).toBeInTheDocument();
  });

  it('renders "Learn more" and "Continue" buttons', () => {
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.WrongUrType}
        flowContext={QrErrorFlowContext.Signing}
        onTryAgain={jest.fn()}
      />,
    );

    expect(screen.getByText(tEn('learnMoreUpperCase'))).toBeInTheDocument();
    expect(screen.getByText(tEn('continue'))).toBeInTheDocument();
  });

  it('calls onTryAgain when "Try again" is clicked', async () => {
    const user = userEvent.setup();
    const onTryAgain = jest.fn();
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.NonUrQrCode}
        flowContext={QrErrorFlowContext.Pairing}
        onTryAgain={onTryAgain}
      />,
    );

    await user.click(screen.getByTestId('qr-error-try-again'));
    expect(onTryAgain).toHaveBeenCalledTimes(1);
  });

  it('opens learn-more URL when "Learn more" is clicked', async () => {
    const user = userEvent.setup();
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.UrDecodeError}
        flowContext={QrErrorFlowContext.Signing}
        onTryAgain={jest.fn()}
      />,
    );

    await user.click(screen.getByTestId('qr-error-learn-more'));
    expect(openTabMock).toHaveBeenCalledWith({
      url: QR_ERROR_LEARN_MORE_URL,
    });
  });

  it('renders the warning icon', () => {
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.UrDecodeError}
        flowContext={QrErrorFlowContext.Pairing}
        onTryAgain={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('qr-error-urDecodeError-pairing'),
    ).toBeInTheDocument();
  });
});
