import React from 'react';
import { it as jestIt } from '@jest/globals';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { parse } from '../../../shared/lib/deep-links/parse';

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

function renderDeepLink(search: string) {
  const store = configureMockStore([thunk])({
    metamask: { preferences: {} },
  });
  return renderWithProvider(<DeepLink />, store, `/link?${search}`);
}

describe('DeepLink', () => {
  beforeAll(async () => {
    global.platform.getExtensionURL = (route = '/') => `home.html#${route}`;
    ({ DeepLink } = await import('./deep-link'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows mobile instructions and the original URL without share=1 in the QR code', () => {
    const url =
      'https://link.metamask.com/mobile-only?value=%2f&share=1#details';
    const sharedUrl = 'https://link.metamask.com/mobile-only?value=%2f#details';
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
    expect(queryByTestId('deep-link-continue-button')).not.toBeInTheDocument();
    expect(queryByTestId('deep-link-checkbox')).not.toBeInTheDocument();
    expect(parseMock).not.toHaveBeenCalled();
  });

  jestIt.each([
    'not a URL',
    'https://example.com/mobile-only?share=1',
    'https://link.metamask.io/mobile-only?share=0',
    'https://link.metamask.io/home?share=1',
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
});
