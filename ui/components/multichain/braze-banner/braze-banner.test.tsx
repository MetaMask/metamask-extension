/* eslint-disable no-script-url -- Exercises rejection of unsafe campaign URLs. */
import { it } from '@jest/globals';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import * as braze from '@braze/web-sdk';
import { selectBrazeBannerHomeEnabled } from '../../../selectors/braze';
import {
  selectCanonicalProfileId,
  selectIsSignedIn,
} from '../../../selectors/identity/authentication';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { getUseExternalServices } from '../../../selectors';
import { useBrazeBanner } from '../../../helpers/braze/use-braze-banner';
import { BrazeBanner } from './braze-banner';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../../../helpers/braze/use-braze-banner');
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

describe('BrazeBanner', () => {
  const dismiss = jest.fn();
  const banner = {
    id: 'banner-1',
    placementId: 'extension-wallet-home',
    getStringProperty: (key: string) =>
      ({ body: 'Hello', deeplink: 'https://link.metamask.io/perps' })[key] ??
      null,
    getImageProperty: () => null,
  } as unknown as braze.Banner;

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useSelector)
      .mockImplementation((selector) =>
        selector === selectCanonicalProfileId ? 'profile-1' : true,
      );
    jest
      .mocked(useBrazeBanner)
      .mockReturnValue({ status: 'visible', banner, dismiss });
    global.platform = {
      openTab: jest.fn(),
    } as unknown as typeof global.platform;
  });

  it('logs one impression for duplicate renders of a banner', () => {
    const { rerender } = render(<BrazeBanner />);
    rerender(<BrazeBanner />);
    expect(braze.logBannerImpressions).toHaveBeenCalledTimes(1);
    expect(braze.logBannerImpressions).toHaveBeenCalledWith([
      'extension-wallet-home',
    ]);
  });

  it('opens a universal link without internal trusted-origin resolution', () => {
    render(<BrazeBanner />);
    fireEvent.click(screen.getByTestId('braze-banner-action'));
    expect(braze.logBannerClick).toHaveBeenCalledWith(banner);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://link.metamask.io/perps',
    });
  });

  it('does not log clicks on close', () => {
    render(<BrazeBanner />);
    fireEvent.click(screen.getByTestId('braze-banner-dismiss'));
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(braze.logBannerClick).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it('never activates an unapproved link', () => {
    jest.mocked(useBrazeBanner).mockReturnValue({
      status: 'visible',
      banner: {
        ...banner,
        getStringProperty: (key: string) =>
          key === 'body' ? 'Hello' : 'javascript:alert(1)',
      } as braze.Banner,
      dismiss,
    });
    render(<BrazeBanner />);
    fireEvent.click(screen.getByTestId('braze-banner-action'));
    expect(braze.logBannerClick).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  it.each([
    selectBrazeBannerHomeEnabled,
    getIsUnlocked,
    getUseExternalServices,
    selectIsSignedIn,
    selectCanonicalProfileId,
  ])('does not mount when a required gate is absent (%s)', (gate) => {
    jest.mocked(useSelector).mockImplementation((selector) => {
      if (selector === gate) {
        return undefined;
      }
      return selector === selectCanonicalProfileId ? 'profile-1' : true;
    });
    const { container } = render(<BrazeBanner />);
    expect(container).toBeEmptyDOMElement();
    expect(useBrazeBanner).not.toHaveBeenCalled();
  });

  it.each(['loading', 'empty', 'dismissed'] as const)(
    'renders nothing while %s',
    (status) => {
      jest
        .mocked(useBrazeBanner)
        .mockReturnValue({ status, banner: null, dismiss });
      const { container } = render(<BrazeBanner />);
      expect(container).toBeEmptyDOMElement();
    },
  );
});
