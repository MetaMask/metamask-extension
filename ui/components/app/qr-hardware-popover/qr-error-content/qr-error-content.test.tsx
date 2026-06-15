import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithLocalization } from '../../../../../test/lib/render-helpers';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { QrErrorContent } from './qr-error-content';
import { QrErrorType, QrErrorFlowContext } from './qr-error-content.types';

describe('QrErrorContent', () => {
  const openTabMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error mocking platform
    globalThis.platform = { openTab: openTabMock };
  });

  it('renders the root element with the correct test-id', () => {
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
  });

  it('renders the resolved title and body text', () => {
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.NonUrQrCode}
        flowContext={QrErrorFlowContext.Pairing}
        onTryAgain={jest.fn()}
      />,
    );

    expect(
      screen.getByText(messages.qrErrorNonUrPairingTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.qrErrorNonUrPairingBody.message),
    ).toBeInTheDocument();
  });

  it('renders "Learn more" and "Continue" button labels', () => {
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.WrongUrType}
        flowContext={QrErrorFlowContext.Signing}
        onTryAgain={jest.fn()}
      />,
    );

    expect(
      screen.getByText(messages.learnMoreUpperCase.message),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.continue.message)).toBeInTheDocument();
  });

  it('calls onTryAgain exactly once when "Continue" is clicked', async () => {
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

  it('opens the learn-more support URL when "Learn more" is clicked', async () => {
    const user = userEvent.setup();
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.UrDecodeError}
        flowContext={QrErrorFlowContext.Signing}
        onTryAgain={jest.fn()}
      />,
    );

    await user.click(screen.getByTestId('qr-error-learn-more'));

    expect(openTabMock).toHaveBeenCalledTimes(1);
    expect(openTabMock).toHaveBeenCalledWith({
      url: ZENDESK_URLS.HARDWARE_QR_WALLETS,
    });
  });

  it('does not call onTryAgain when "Learn more" is clicked', async () => {
    const user = userEvent.setup();
    const onTryAgain = jest.fn();
    renderWithLocalization(
      <QrErrorContent
        errorType={QrErrorType.UrDecodeError}
        flowContext={QrErrorFlowContext.Pairing}
        onTryAgain={onTryAgain}
      />,
    );

    await user.click(screen.getByTestId('qr-error-learn-more'));

    expect(onTryAgain).not.toHaveBeenCalled();
  });
});
