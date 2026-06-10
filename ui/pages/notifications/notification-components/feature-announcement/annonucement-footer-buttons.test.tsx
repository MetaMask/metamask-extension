import React from 'react';
import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
import { createMockFeatureAnnouncementRaw } from '@metamask/notification-services-controller/notification-services/mocks';
import {
  MetaMetricsContext,
  type MetaMetricsContextValue,
} from '../../../../contexts/metametrics';
import {
  ExtensionLinkButton,
  ExternalLinkButton,
} from './annonucement-footer-buttons';
import type { FeatureAnnouncementNotification } from './types';

const mockTrackEvent = jest.fn();
const mockNavigate = jest.fn();
const linkText = 'Learn more';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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

function createFeatureAnnouncementNotificationWithExtensionLink(
  extensionLinkRoute = 'home.html',
): FeatureAnnouncementNotification {
  const rawNotification = createMockFeatureAnnouncementRaw();

  return processNotification({
    ...rawNotification,
    data: {
      ...rawNotification.data,
      extensionLink: {
        extensionLinkText: linkText,
        extensionLinkRoute,
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

function renderExtensionLinkButton(extensionLinkRoute?: string) {
  render(
    <MetaMetricsContext.Provider value={metametricsContext}>
      <ExtensionLinkButton
        notification={createFeatureAnnouncementNotificationWithExtensionLink(
          extensionLinkRoute,
        )}
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

    const link = screen.getByRole('link', { name: linkText });
    await waitFor(() => expect(link).toHaveAttribute('target', '_blank'));

    const clickEvent = createEvent.click(link);

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);

    await waitFor(() =>
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://example.com',
      }),
    );
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
  });

  it('opens an extension link route with client-side navigation', () => {
    renderExtensionLinkButton('settings/security');

    const link = screen.getByRole('link', { name: linkText });
    const clickEvent = createEvent.click(link);

    expect(link).toHaveAttribute('href', '/settings/security');
    expect(link).not.toHaveAttribute('target');

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/settings/security');
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('opens an internal deep link route in an extension tab', async () => {
    renderExternalLinkButton(
      'https://link.metamask.io/shield?showShieldEntryModal=true&utm_source=contentful',
    );

    const link = screen.getByRole('link', { name: linkText });
    await waitFor(() => expect(link).not.toHaveAttribute('target'));

    fireEvent.click(link);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/settings?showShieldEntryModal=true&utm_source=contentful',
      ),
    );
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('lets modified clicks use native link navigation', async () => {
    renderExternalLinkButton('https://example.com');

    const link = screen.getByRole('link', { name: linkText });
    await waitFor(() => expect(link).toHaveAttribute('target', '_blank'));
    const clickEvent = createEvent.click(link, { ctrlKey: true });

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
    expect(global.platform.openTab).not.toHaveBeenCalled();
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
  });

  it('lets non-primary clicks use native link navigation', async () => {
    renderExternalLinkButton('https://example.com');

    const link = screen.getByRole('link', { name: linkText });
    await waitFor(() => expect(link).toHaveAttribute('target', '_blank'));
    const clickEvent = createEvent.click(link, { button: 1 });

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
    expect(global.platform.openTab).not.toHaveBeenCalled();
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
  });

  it('opens a deep link redirect URL in a new tab', async () => {
    renderExternalLinkButton('https://link.metamask.io/buy?amount=100');

    const link = screen.getByRole('link', { name: linkText });
    await waitFor(() => expect(link).toHaveAttribute('target', '_blank'));

    fireEvent.click(link);

    await waitFor(() =>
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://app.metamask.io/buy?amount=100',
      }),
    );
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
  });
});
