import React from 'react';
import { it as jestIt } from '@jest/globals';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { enLocale as messages, tEn } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  parse,
  type ParsedDeepLink,
} from '../../../shared/lib/deep-links/parse';
import { CANONICAL_DEEP_LINK_HOST } from '../../../shared/lib/deep-links/common';
import type { SignatureStatus } from '../../../shared/lib/deep-links/verify';

let DeepLink: typeof import('./deep-link').DeepLink;

jest.mock('../../../shared/lib/deep-links/parse', () => ({
  parse: jest.fn(),
}));

jest.mock('../../components/app/deeplink-qr-code', () => ({
  QRCodeImage: ({ data }: { data: string }) => (
    <div data-testid="qr-code-image" data-qr-value={data} />
  ),
}));

const parseMock = jest.mocked(parse);

function renderDeepLink(
  search: string,
  {
    referralEnabled = true,
    useExternalServices = true,
  }: { referralEnabled?: boolean; useExternalServices?: boolean } = {},
) {
  const store = configureMockStore([thunk])({
    metamask: {
      preferences: {},
      useExternalServices,
      remoteFeatureFlags: {
        rewardsMoneyControllerEnabled: {
          enabled: referralEnabled,
          minimumVersion: '0.0.0',
        },
      },
    },
  });
  return renderWithProvider(<DeepLink />, store, `/link?${search}`);
}

function mockParsedLink(
  destination: { path: string; query: URLSearchParams } | { redirectTo: URL },
  signature: SignatureStatus = 'missing',
) {
  parseMock.mockResolvedValue({
    signature,
    destination,
    route: { getTitle: () => 'deepLink_theHomePage' },
  } as unknown as ParsedDeepLink);
}

describe('DeepLink', () => {
  beforeAll(async () => {
    global.platform.getExtensionURL = (route = null, query = null) =>
      `chrome-extension://extension-id/home.html${route ? `#${route}` : ''}${query ? `?${query}` : ''}`;
    ({ DeepLink } = await import('./deep-link'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows mobile instructions and the canonical URL without share=1 in the QR code', () => {
    const url = '/mobile-only?value=%2f&share=1';
    const sharedUrl = `https://${CANONICAL_DEEP_LINK_HOST}/mobile-only?value=%2f`;
    const { getByRole, getByText, getByTestId, queryByTestId } = renderDeepLink(
      new URLSearchParams({ mobileShare: url }).toString(),
    );

    expect(
      getByRole('heading', {
        name: messages.deepLink_MobileShareTitle.message,
      }),
    ).toBeInTheDocument();
    expect(
      getByText(messages.deepLink_MobileShareDescription.message),
    ).toBeInTheDocument();
    expect(getByText(sharedUrl)).toBeInTheDocument();
    expect(getByTestId('qr-code-image')).toHaveAttribute(
      'data-qr-value',
      sharedUrl,
    );
    expect(queryByTestId('deep-link-checkbox')).not.toBeInTheDocument();
    expect(parseMock).not.toHaveBeenCalled();
  });

  it('links to Home from the mobile share screen', () => {
    const { getByRole } = renderDeepLink(
      new URLSearchParams({
        mobileShare: '/mobile-only?share=1',
      }).toString(),
    );

    expect(
      getByRole('link', {
        name: messages.deepLink_GoToTheHomePageButton.message,
      }),
    ).toHaveAttribute('href', 'chrome-extension://extension-id/home.html#/');
  });

  it('copies the shared URL from the mobile share screen', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const { getByRole, findByRole } = renderDeepLink(
      new URLSearchParams({
        mobileShare: '/mobile-only?share=1',
      }).toString(),
    );

    fireEvent.click(
      getByRole('button', { name: messages.copyToClipboard.message }),
    );

    expect(writeText).toHaveBeenCalledWith(
      `https://${CANONICAL_DEEP_LINK_HOST}/mobile-only`,
    );
    expect(
      await findByRole('button', { name: messages.copiedExclamation.message }),
    ).toBeInTheDocument();
  });

  jestIt.each([
    'not a URL',
    'https://example.com/mobile-only?share=1',
    'https://link.metamask.io/mobile-only?share=1',
    '/mobile-only?share=0',
    '/home?share=1',
  ])('does not display the QR fallback for %s', async (url) => {
    const { findByText, queryByTestId } = renderDeepLink(
      new URLSearchParams({ mobileShare: url }).toString(),
    );

    expect(
      await findByText(messages.deepLink_ErrorMissingUrl.message),
    ).toBeInTheDocument();
    expect(queryByTestId('deep-link-mobile-share')).not.toBeInTheDocument();
  });

  it('preserves the security interstitial for matched routes', async () => {
    parseMock.mockResolvedValue({
      signature: 'missing',
      destination: { path: '/', query: new URLSearchParams() },
      route: { getTitle: () => 'deepLink_theHomePage' },
    } as Exclude<Awaited<ReturnType<typeof parse>>, false>);
    const { findByText, queryByTestId } = renderDeepLink(
      new URLSearchParams({ u: '/home?share=1' }).toString(),
    );

    expect(
      await findByText(messages.deepLink_Caution.message),
    ).toBeInTheDocument();
    expect(queryByTestId('deep-link-mobile-share')).not.toBeInTheDocument();
  });
  describe('referral continuation', () => {
    jestIt.each(['missing', 'valid'] as const)(
      'includes a portable referral in the actual anchor for a %s signature',
      async (signature) => {
        parseMock.mockResolvedValue({
          signature,
          destination: {
            path: '/money',
            query: new URLSearchParams('asset=ETH'),
          },
          route: { getTitle: () => 'money' },
        } as unknown as ParsedDeepLink);
        const { findByTestId } = renderDeepLink(
          new URLSearchParams({ u: '/money?ref=abc123' }).toString(),
        );

        const anchor = await findByTestId('deep-link-continue-button');
        const href = new URL(anchor.getAttribute('href') ?? '');
        expect(href.searchParams.get('ref')).toBe('ABC123');
        expect(href.searchParams.has('refEntryType')).toBe(false);
        expect(href.hash).toBe('#/money?asset=ETH');
        expect(anchor.tagName).toBe('A');
      },
    );

    it('marks a referral restored from a deferred link', async () => {
      parseMock.mockResolvedValue({
        signature: 'missing',
        destination: { path: '/money', query: new URLSearchParams() },
        route: { getTitle: () => 'deepLink_theMoneyPage' },
      } as unknown as ParsedDeepLink);
      const { findByTestId } = renderDeepLink(
        new URLSearchParams({
          u: '/money?ref=abc123',
          refEntryType: 'restored_context',
        }).toString(),
      );

      const anchor = await findByTestId('deep-link-continue-button');
      const href = new URL(anchor.getAttribute('href') ?? '');
      expect(href.searchParams.get('ref')).toBe('ABC123');
      expect(href.searchParams.get('refEntryType')).toBe('restored_context');
    });
  });

  describe('referral interstitial copy', () => {
    const homeDestination = { path: '/', query: new URLSearchParams() };
    const continueDescription = tEn('deepLink_ContinueDescription', [
      tEn('deepLink_theHomePage'),
    ]);
    const cautionDescription = tEn('deepLink_ThirdPartyDescription', [
      continueDescription,
    ]);

    async function expectCopy(
      { findByRole, findByTestId }: ReturnType<typeof renderDeepLink>,
      title: string,
      description: string,
    ) {
      expect(await findByRole('heading', { name: title })).toBeInTheDocument();
      expect(await findByTestId('deep-link-description')).toHaveTextContent(
        description,
      );
    }

    jestIt.each<[SignatureStatus, string]>([
      ['missing', '/home?ref=ABCD12'],
      ['invalid', '/home?ref=ABCD12'],
      ['missing', '/home?ref=%20abcd12%20'],
    ])(
      'shows the referral copy for a %s signature and %s',
      async (signature, u) => {
        mockParsedLink(homeDestination, signature);
        const result = renderDeepLink(new URLSearchParams({ u }).toString());

        await expectCopy(
          result,
          messages.deepLink_ReferralTitle.message,
          messages.deepLink_ReferralDescription.message,
        );
        expect(
          await result.findByTestId('deep-link-continue-button'),
        ).toHaveTextContent(messages.deepLink_Continue.message);
        expect(result.queryByTestId('deep-link-checkbox')).toBeNull();
      },
    );

    jestIt.each([
      ['no ref', '/home'],
      ['a short ref', '/home?ref=ab'],
      ['a malformed ref', '/home?ref=AB!'],
      ['a duplicate ref', '/home?ref=ABC&ref=DEF'],
    ])('keeps the caution copy for %s', async (_, u) => {
      mockParsedLink(homeDestination);

      await expectCopy(
        renderDeepLink(new URLSearchParams({ u }).toString()),
        messages.deepLink_Caution.message,
        cautionDescription,
      );
    });

    jestIt.each([
      ['the referral flag is off', { referralEnabled: false }],
      ['Basic Functionality is off', { useExternalServices: false }],
    ])('keeps the caution copy when %s', async (_, options) => {
      mockParsedLink(homeDestination);

      await expectCopy(
        renderDeepLink(
          new URLSearchParams({ u: '/home?ref=ABCD12' }).toString(),
          options,
        ),
        messages.deepLink_Caution.message,
        cautionDescription,
      );
    });

    it('keeps the caution copy for a link that redirects to a website', async () => {
      mockParsedLink({
        redirectTo: new URL('https://metamask.io/news/top-traders'),
      });

      await expectCopy(
        renderDeepLink(
          new URLSearchParams({ u: '/top-traders?ref=ABCD12' }).toString(),
        ),
        messages.deepLink_Caution.message,
        cautionDescription,
      );
    });

    it('keeps the redirecting copy for a signed link with a ref', async () => {
      mockParsedLink(homeDestination, 'valid');

      await expectCopy(
        renderDeepLink(
          new URLSearchParams({ u: '/home?ref=ABCD12' }).toString(),
        ),
        messages.deepLink_RedirectingToMetaMask.message,
        continueDescription,
      );
    });
  });
});
