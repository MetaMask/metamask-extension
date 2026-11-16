import { it } from '@jest/globals';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { BrazeBanner as BrazeBannerData } from '../../../../shared/lib/braze';
import { captureException } from '../../../../shared/lib/sentry';
import { BrazeBanner } from './braze-banner';

const mockCall = jest.fn();
const mockMessenger = { call: mockCall };
jest.mock('../../../hooks/useMessenger', () => ({
  useMessenger: () => mockMessenger,
}));

jest.mock('../../../contexts/route-messenger', () => ({
  RouteMessengerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const PLACEMENT_ID = 'extension-wallet-home';

const banner: BrazeBannerData = {
  id: 'banner-1',
  placementId: PLACEMENT_ID,
  isControl: false,
  title: 'Welcome',
  body: 'Explore your wallet',
  imageUrl: null,
  ctaLabel: null,
  deeplink: 'https://link.metamask.io/swap',
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const renderBanner = async (result: BrazeBannerData | null) => {
  mockCall.mockImplementation(async (action: string) =>
    action === 'BrazeService:getBanner' ? result : undefined,
  );
  const rendered = render(<BrazeBanner />);
  await act(flushPromises);
  return rendered;
};

describe('BrazeBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.platform = {
      openTab: jest.fn(),
    } as unknown as typeof global.platform;
  });

  it('requests the home banner once', async () => {
    await renderBanner(null);

    expect(
      mockCall.mock.calls.filter(
        ([action]) => action === 'BrazeService:getBanner',
      ),
    ).toStrictEqual([['BrazeService:getBanner', PLACEMENT_ID]]);
  });

  it('renders nothing without a banner', async () => {
    await renderBanner(null);

    expect(screen.queryByTestId('braze-banner')).not.toBeInTheDocument();
    expect(mockCall).not.toHaveBeenCalledWith(
      'BrazeService:logBannerImpression',
      expect.anything(),
      expect.anything(),
    );
  });

  it('renders the banner and logs its impression', async () => {
    await renderBanner(banner);

    expect(screen.getByText('Explore your wallet')).toBeInTheDocument();
    expect(mockCall).toHaveBeenCalledWith(
      'BrazeService:logBannerImpression',
      PLACEMENT_ID,
      'banner-1',
    );
  });

  it('logs the impression of a control banner without rendering it', async () => {
    await renderBanner({ ...banner, isControl: true, body: null, title: null });

    expect(screen.queryByTestId('braze-banner')).not.toBeInTheDocument();
    expect(mockCall).toHaveBeenCalledWith(
      'BrazeService:logBannerImpression',
      PLACEMENT_ID,
      'banner-1',
    );
  });

  it('logs the click and opens the link', async () => {
    await renderBanner(banner);

    fireEvent.click(screen.getByTestId('braze-banner-action'));

    expect(mockCall).toHaveBeenCalledWith(
      'BrazeService:logBannerClick',
      PLACEMENT_ID,
      'banner-1',
    );
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://link.metamask.io/swap',
    });
  });

  it('renders a passive banner without a link', async () => {
    await renderBanner({ ...banner, deeplink: null });

    fireEvent.click(screen.getByTestId('braze-banner-action'));

    expect(screen.getByTestId('braze-banner-action').tagName).toBe('DIV');
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('hides the banner and dismisses it', async () => {
    await renderBanner(banner);

    fireEvent.click(screen.getByTestId('braze-banner-dismiss'));
    await act(flushPromises);

    expect(screen.queryByTestId('braze-banner')).not.toBeInTheDocument();
    expect(mockCall).toHaveBeenCalledWith(
      'BrazeService:dismissBanner',
      PLACEMENT_ID,
      'banner-1',
    );
  });

  it('ignores a banner that arrives after unmounting', async () => {
    let resolveBanner: (value: BrazeBannerData) => void = () => undefined;
    mockCall.mockImplementation(
      (action: string) =>
        new Promise((resolve) => {
          if (action === 'BrazeService:getBanner') {
            resolveBanner = resolve;
          }
        }),
    );
    const { unmount } = render(<BrazeBanner />);
    unmount();

    resolveBanner(banner);
    await act(flushPromises);

    expect(mockCall).toHaveBeenCalledTimes(1);
  });

  it('reports a failed request', async () => {
    const error = new Error('not registered');
    mockCall.mockRejectedValue(error);

    render(<BrazeBanner />);
    await act(flushPromises);

    expect(captureException).toHaveBeenCalledWith(error);
    expect(screen.queryByTestId('braze-banner')).not.toBeInTheDocument();
  });
});
