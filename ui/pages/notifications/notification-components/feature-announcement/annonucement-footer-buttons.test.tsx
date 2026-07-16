import React from 'react';
import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
import { createMockFeatureAnnouncementRaw } from '@metamask/notification-services-controller/notification-services/mocks';
import * as resolveDeepLinkHrefUtils from '../../../../helpers/utils/resolve-deep-link-href';
import {
  ExtensionLinkButton,
  ExternalLinkButton,
} from './annonucement-footer-buttons';
import type { FeatureAnnouncementNotification } from './types';

const mockNavigate = jest.fn();
const linkText = 'Learn more';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

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

function createExternalLinkButton(externalLinkUrl: string) {
  return (
    <ExternalLinkButton
      notification={createFeatureAnnouncementNotification(externalLinkUrl)}
    />
  );
}

function renderExternalLinkButton(externalLinkUrl: string) {
  return render(createExternalLinkButton(externalLinkUrl));
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

function createDeferred<ResolvedValue = void>() {
  let resolvePromise: (
    value: ResolvedValue | PromiseLike<ResolvedValue>,
  ) => void = () => undefined;

  const promise = new Promise<ResolvedValue>((resolvedValue) => {
    resolvePromise = resolvedValue;
  });

  return { promise, resolve: resolvePromise };
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

  it('opens the home extension link route with client-side navigation', () => {
    renderExtensionLinkButton('home.html');

    const link = screen.getByRole('link', { name: linkText });
    const clickEvent = createEvent.click(link);

    expect(link).toHaveAttribute('href', '/home.html');
    expect(link).not.toHaveAttribute('target');

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('opens a home hash extension link route with client-side navigation', () => {
    renderExtensionLinkButton('home.html#/settings/security');

    const link = screen.getByRole('link', { name: linkText });
    const clickEvent = createEvent.click(link);

    expect(link).toHaveAttribute('href', '/home.html#/settings/security');
    expect(link).not.toHaveAttribute('target');

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/settings/security');
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('opens an unsupported extension link route with native link navigation', () => {
    renderExtensionLinkButton('settings/security');

    const link = screen.getByRole('link', { name: linkText });
    const clickEvent = createEvent.click(link);

    expect(link).toHaveAttribute('href', '/settings/security');
    expect(link).toHaveAttribute('target', '_blank');

    fireEvent(link, clickEvent);

    expect(clickEvent.defaultPrevented).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(global.platform.openExtensionInBrowser).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('opens an internal deep link route in an extension tab', async () => {
    renderExternalLinkButton(
      'https://link.metamask.io/shield?showShieldEntryModal=true&utm_source=contentful',
    );

    const link = screen.getByRole('link', { name: linkText });
    await waitFor(() => {
      expect(link).toHaveAttribute(
        'href',
        '/settings?showShieldEntryModal=true&utm_source=contentful',
      );
      expect(link).not.toHaveAttribute('target');
    });

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

  it('reuses an in-flight deep link resolution when clicked', async () => {
    const deferredResolution = createDeferred<string>();
    const resolveTrustedDeepLinkHrefSpy = jest
      .spyOn(resolveDeepLinkHrefUtils, 'resolveTrustedDeepLinkHref')
      .mockReturnValue(deferredResolution.promise);

    renderExternalLinkButton('https://link.metamask.io/buy?amount=100');

    await waitFor(() =>
      expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledTimes(1),
    );

    fireEvent.click(screen.getByRole('link', { name: linkText }));

    expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledTimes(1);

    deferredResolution.resolve('https://app.metamask.io/buy?amount=100');

    await waitFor(() =>
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://app.metamask.io/buy?amount=100',
      }),
    );
  });

  it('does not reuse a resolved href after the external link URL changes', async () => {
    const firstUrl = 'https://link.metamask.io/buy?amount=100';
    const firstResolvedUrl = 'https://app.metamask.io/buy?amount=100';
    const secondUrl = 'https://link.metamask.io/buy?amount=200';
    const secondResolvedUrl = 'https://app.metamask.io/buy?amount=200';
    const secondResolution = createDeferred<string>();
    const resolveTrustedDeepLinkHrefSpy = jest
      .spyOn(resolveDeepLinkHrefUtils, 'resolveTrustedDeepLinkHref')
      .mockImplementation((href) => {
        if (href === firstUrl) {
          return Promise.resolve(firstResolvedUrl);
        }

        if (href === secondUrl) {
          return secondResolution.promise;
        }

        return Promise.resolve(href);
      });
    const { rerender } = renderExternalLinkButton(firstUrl);

    await waitFor(() =>
      expect(screen.getByRole('link', { name: linkText })).toHaveAttribute(
        'href',
        firstResolvedUrl,
      ),
    );

    rerender(createExternalLinkButton(secondUrl));

    expect(screen.getByRole('link', { name: linkText })).toHaveAttribute(
      'href',
      secondUrl,
    );
    await waitFor(() =>
      expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledWith(secondUrl),
    );

    fireEvent.click(screen.getByRole('link', { name: linkText }));

    expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondResolution.resolve(secondResolvedUrl);
      await secondResolution.promise;
    });

    await waitFor(() =>
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: secondResolvedUrl,
      }),
    );
    expect(global.platform.openTab).not.toHaveBeenCalledWith({
      url: firstResolvedUrl,
    });
  });

  it('keeps the current in-flight deep link resolution when an older preload settles', async () => {
    const firstUrl = 'https://link.metamask.io/buy?amount=100';
    const firstResolvedUrl = 'https://app.metamask.io/buy?amount=100';
    const secondUrl = 'https://link.metamask.io/buy?amount=200';
    const secondResolvedUrl = 'https://app.metamask.io/buy?amount=200';
    const firstResolution = createDeferred<string>();
    const secondResolution = createDeferred<string>();
    const resolveTrustedDeepLinkHrefSpy = jest
      .spyOn(resolveDeepLinkHrefUtils, 'resolveTrustedDeepLinkHref')
      .mockImplementation((href) => {
        if (href === firstUrl) {
          return firstResolution.promise;
        }

        if (href === secondUrl) {
          return secondResolution.promise;
        }

        return Promise.resolve(href);
      });
    const { rerender } = renderExternalLinkButton(firstUrl);

    await waitFor(() =>
      expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledWith(firstUrl),
    );

    rerender(createExternalLinkButton(secondUrl));

    await waitFor(() =>
      expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledWith(secondUrl),
    );
    expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      firstResolution.resolve(firstResolvedUrl);
      await firstResolution.promise;
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('link', { name: linkText }));

    expect(resolveTrustedDeepLinkHrefSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondResolution.resolve(secondResolvedUrl);
      await secondResolution.promise;
    });

    await waitFor(() =>
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: secondResolvedUrl,
      }),
    );
    expect(global.platform.openTab).not.toHaveBeenCalledWith({
      url: firstResolvedUrl,
    });
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
