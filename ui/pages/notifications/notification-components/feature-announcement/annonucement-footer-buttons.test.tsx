import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
import { createMockFeatureAnnouncementRaw } from '@metamask/notification-services-controller/notification-services/mocks';
import {
  MetaMetricsContext,
  type MetaMetricsContextValue,
} from '../../../../contexts/metametrics';
import { ExternalLinkButton } from './annonucement-footer-buttons';
import type { FeatureAnnouncementNotification } from './types';

const mockTrackEvent = jest.fn();
const linkText = 'Learn more';

const metametricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
} as unknown as MetaMetricsContextValue;

function createFeatureAnnouncementNotification(
  externalLinkUrl: string,
): FeatureAnnouncementNotification {
  const rawNotification = createMockFeatureAnnouncementRaw();

  return processNotification({
    ...rawNotification,
    data: {
      ...rawNotification.data,
      externalLink: {
        externalLinkText: linkText,
        externalLinkUrl,
      },
    },
  }) as FeatureAnnouncementNotification;
}

function renderExternalLinkButton(externalLinkUrl: string) {
  render(
    <MetaMetricsContext.Provider value={metametricsContext}>
      <ExternalLinkButton
        notification={createFeatureAnnouncementNotification(externalLinkUrl)}
      />
    </MetaMetricsContext.Provider>,
  );
}

describe('Feature announcement footer buttons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.platform = {
      openExtensionInBrowser: jest.fn(),
      openTab: jest.fn(),
    } as unknown as typeof global.platform;
  });

  it('opens a non-deep-link external URL in a new tab', async () => {
    renderExternalLinkButton('https://example.com');

    fireEvent.click(screen.getByRole('link', { name: linkText }));

    await waitFor(() =>
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://example.com',
      }),
    );
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
  });

  it('opens an internal deep link route in an extension tab', async () => {
    renderExternalLinkButton(
      'https://link.metamask.io/shield?showShieldEntryModal=true&utm_source=contentful',
    );

    fireEvent.click(screen.getByRole('link', { name: linkText }));

    await waitFor(() =>
      expect(global.platform.openExtensionInBrowser).toHaveBeenCalledWith(
        '/settings?showShieldEntryModal=true&utm_source=contentful',
        null,
        true,
      ),
    );
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('opens a deep link redirect URL in a new tab', async () => {
    renderExternalLinkButton('https://link.metamask.io/buy?amount=100');

    fireEvent.click(screen.getByRole('link', { name: linkText }));

    await waitFor(() =>
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://app.metamask.io/buy?amount=100',
      }),
    );
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
  });
});
