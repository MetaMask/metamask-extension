import React from 'react';
import { it } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { parse, type ParsedDeepLink } from '#shared/lib/deep-links/parse';
import { createMemoryRouterWrapper } from '../../../test/lib/render-helpers-navigate';

jest.mock('#shared/lib/deep-links/parse', () => ({ parse: jest.fn() }));
const mockT = (key: string) => key;
jest.mock('#ui/hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));
jest.mock('#ui/components/app/full-page-card/full-page-card', () => ({
  FullPageCard: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

let DeepLink: typeof import('#ui/pages/deep-link/deep-link').DeepLink;
beforeAll(async () => {
  globalThis.platform.getExtensionURL = (route = null, query = null) =>
    `chrome-extension://extension-id/home.html${route ? `#${route}` : ''}${query ? `?${query}` : ''}`;
  ({ DeepLink } = await import('#ui/pages/deep-link/deep-link'));
});

describe('DeepLink referral continuation', () => {
  it.each(['missing', 'valid'] as const)(
    'includes a portable referral in the actual anchor for a %s signature',
    async (signature) => {
      jest.mocked(parse).mockResolvedValue({
        signature,
        destination: {
          path: '/money',
          query: new URLSearchParams('asset=ETH'),
        },
        route: { getTitle: () => 'money' },
      } as unknown as ParsedDeepLink);
      const store = configureStore({
        reducer: () => ({
          metamask: { preferences: { skipDeepLinkInterstitial: false } },
        }),
      });
      render(<DeepLink />, {
        wrapper: createMemoryRouterWrapper({
          store,
          initialEntries: ['/link?u=%2Fmoney%3Fref%3Dabc123'],
        }),
      });

      const anchor = await screen.findByTestId('deep-link-continue-button');
      const href = new URL(anchor.getAttribute('href') ?? '');
      expect(href.searchParams.get('ref')).toBe('ABC123');
      expect(href.hash).toBe('#/money?asset=ETH');
      expect(anchor.tagName).toBe('A');
    },
  );
});
