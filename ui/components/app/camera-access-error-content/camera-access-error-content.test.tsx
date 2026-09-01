import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithLocalization } from '../../../../test/lib/render-helpers';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import {
  CameraAccessErrorContent,
  CameraAccessErrorContentVariant,
} from './camera-access-error-content';

describe('CameraAccessErrorContent', () => {
  describe('needed variant', () => {
    it('renders localized title, body, and continue control', async () => {
      const user = userEvent.setup();
      const onContinue = jest.fn();
      renderWithLocalization(
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Needed}
          onContinue={onContinue}
        />,
      );

      expect(screen.getByTestId('qr-camera-access-needed')).toBeInTheDocument();
      expect(
        screen.getByText(messages.qrCameraAccessNeededTitle.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.qrCameraAccessNeededBody.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.continue.message)).toBeInTheDocument();
      await user.click(screen.getByTestId('qr-camera-access-needed-continue'));
      expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('accepts zero root padding without breaking layout', () => {
      renderWithLocalization(
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Needed}
          onContinue={jest.fn()}
          rootPaddingHorizontal={0}
          rootPaddingBottom={0}
        />,
      );

      expect(screen.getByTestId('qr-camera-access-needed')).toBeInTheDocument();
      expect(
        screen.getByText(messages.qrCameraAccessNeededTitle.message),
      ).toBeInTheDocument();
    });
  });

  describe('blocked variant', () => {
    it('shows chromium hint and open settings when not Firefox', () => {
      const onContinue = jest.fn();
      const onOpenSettings = jest.fn();
      renderWithLocalization(
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Blocked}
          isFirefox={false}
          mozExtensionDisplay=""
          onOpenSettings={onOpenSettings}
          onContinue={onContinue}
        />,
      );

      expect(
        screen.getByTestId('qr-camera-access-blocked'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('qr-camera-chromium-hint')).toHaveTextContent(
        messages.qrCameraAccessBlockedChromiumHint.message,
      );
      expect(
        screen.getByTestId('qr-camera-chromium-hint-videocam'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('qr-camera-open-settings')).toBeInTheDocument();
      expect(
        screen.queryByTestId('qr-camera-firefox-instructions'),
      ).not.toBeInTheDocument();
    });

    it('shows firefox instructions when Firefox', () => {
      const mozOrigin = 'moz-extension://abc';
      renderWithLocalization(
        <CameraAccessErrorContent
          variant={CameraAccessErrorContentVariant.Blocked}
          isFirefox
          mozExtensionDisplay={mozOrigin}
          onOpenSettings={jest.fn()}
          onContinue={jest.fn()}
        />,
      );

      expect(
        screen.getByTestId('qr-camera-firefox-instructions'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`1. ${tEn('qrCameraAccessBlockedFirefoxStep1', [])}`),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `2. ${tEn('qrCameraAccessBlockedFirefoxStep2', [mozOrigin])}`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(`3. ${tEn('qrCameraAccessBlockedFirefoxStep3', [])}`),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('qr-camera-open-settings'),
      ).not.toBeInTheDocument();
    });
  });
});
