import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createDeferredPromise } from '@metamask/utils';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  type ParsedDeepLink,
  parse,
} from '../../../shared/lib/deep-links/parse';
import { verify } from '../../../shared/lib/deep-links/verify';
import { DeepLink } from './deep-link';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../shared/lib/deep-links/parse', () => ({
  parse: jest.fn(),
}));

jest.mock('../../../shared/lib/deep-links/verify', () => ({
  ...jest.requireActual('../../../shared/lib/deep-links/verify'),
  verify: jest.fn(),
}));

const mockTranslate = (key: string) => key;
const mockDispatch = jest.fn();

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockTranslate,
}));

jest.mock('../../store/hooks', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../shared/lib/selectors/preferences', () => ({
  getPreferences: () => ({ skipDeepLinkInterstitial: false }),
}));

const mockUseLocation = jest.mocked(useLocation);
const mockUseSelector = jest.mocked(useSelector);
const mockParse = jest.mocked(parse);
const mockVerify = jest.mocked(verify);
let pendingDeepLinkRequestIds: string[] = [];

function createLocation(search: string): ReturnType<typeof useLocation> {
  return {
    pathname: '/link',
    search,
    hash: '',
    key: '',
    state: undefined,
  };
}

function createParsedDeepLink(path: string, query = ''): ParsedDeepLink {
  return {
    destination: {
      path,
      query: new URLSearchParams(query),
    },
    signature: 'valid',
    route: {
      getTitle: () => 'deepLink_destination',
    },
  } as unknown as ParsedDeepLink;
}

describe('DeepLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pendingDeepLinkRequestIds = [];
    mockUseSelector.mockImplementation((selector) =>
      selector({ metamask: { pendingDeepLinkRequestIds } } as never),
    );
    globalThis.platform = {
      getExtensionURL: (path: string, query?: string | null) =>
        `chrome-extension://extension-id/home.html#${path}${
          query ? `?${query}` : ''
        }`,
    } as never;
  });

  it('stays in loading-only mode while pre-parsing for fast interstitial flip', async () => {
    pendingDeepLinkRequestIds = ['request-1'];
    mockUseLocation.mockReturnValue(createLocation('?u=%2Fbuy&id=request-1'));
    mockParse.mockResolvedValue(createParsedDeepLink('/buy'));

    render(<DeepLink />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockParse).toHaveBeenCalledTimes(1);
      expect(mockVerify).not.toHaveBeenCalled();
    });
    expect(
      screen.queryByTestId('deep-link-continue-button'),
    ).not.toBeInTheDocument();
  });

  it('reuses pre-parsed result when mode flips from loading to interstitial for the same u', async () => {
    pendingDeepLinkRequestIds = ['request-1'];
    const currentSearch = '?u=%2Fbuy%3Famount%3D1&id=request-1';
    mockUseLocation.mockImplementation(() => createLocation(currentSearch));
    mockParse.mockResolvedValue(createParsedDeepLink('/buy', 'amount=1'));

    const { rerender } = render(<DeepLink />);

    await waitFor(() => {
      expect(mockParse).toHaveBeenCalledTimes(1);
    });

    pendingDeepLinkRequestIds = [];
    rerender(<DeepLink />);

    await waitFor(() => {
      expect(
        screen.getByTestId('deep-link-continue-button'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('deep-link-checkbox')).toBeInTheDocument();
    expect(mockParse).toHaveBeenCalledTimes(1);
  });

  it('parses and renders interstitial content when mode is not loading', async () => {
    mockUseLocation.mockReturnValue(createLocation('?u=%2Fbuy%3Famount%3D1'));
    mockParse.mockResolvedValue(createParsedDeepLink('/buy', 'amount=1'));

    render(<DeepLink />);

    await waitFor(() => {
      expect(mockParse).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId('deep-link-continue-button'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('deep-link-checkbox')).toBeInTheDocument();
  });

  it('renders warning content for an unsigned route', async () => {
    mockUseLocation.mockReturnValue(createLocation('?u=%2Fbuy'));
    const parsed = createParsedDeepLink('/buy');
    parsed.signature = 'invalid';
    mockParse.mockResolvedValue(parsed);

    render(<DeepLink />);

    expect(await screen.findByText('deepLink_Caution')).toBeInTheDocument();
    expect(
      screen.getByText('deepLink_ThirdPartyDescription'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('deep-link-checkbox')).not.toBeInTheDocument();
  });

  it('uses an external redirect as the continue destination', async () => {
    mockUseLocation.mockReturnValue(createLocation('?u=%2Fbuy'));
    mockParse.mockResolvedValue({
      destination: {
        redirectTo: new URL('https://example.com/redirect'),
      },
      signature: 'valid',
      route: {
        getTitle: () => 'deepLink_destination',
      },
    } as unknown as ParsedDeepLink);

    render(<DeepLink />);

    expect(
      await screen.findByTestId('deep-link-continue-button'),
    ).toHaveAttribute('href', 'https://example.com/redirect');
  });

  it('renders an unsupported signed route with an update link', async () => {
    mockUseLocation.mockReturnValue(createLocation('?u=%2Funknown'));
    mockParse.mockResolvedValue(false);
    mockVerify.mockResolvedValue('valid');

    render(<DeepLink />);

    expect(
      await screen.findByText('deepLink_Error404Title'),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText('Error 404: Page not found'),
    ).toBeInTheDocument();
    expect(screen.getByText('deepLink_Error404_CTA')).toBeInTheDocument();
  });

  it('renders an unsupported unsigned route without an update link', async () => {
    mockUseLocation.mockReturnValue(createLocation('?u=%2Funknown'));
    mockParse.mockResolvedValue(false);
    mockVerify.mockResolvedValue('invalid');

    render(<DeepLink />);

    expect(
      await screen.findByText('deepLink_Error404Title'),
    ).toBeInTheDocument();
    expect(screen.queryByText('deepLink_Error404_CTA')).not.toBeInTheDocument();
  });

  it('renders the generic error when parsing fails', async () => {
    mockUseLocation.mockReturnValue(createLocation('?u=%2Fbuy'));
    mockParse.mockRejectedValue(new Error('parse failed'));

    render(<DeepLink />);

    expect(
      await screen.findByText('deepLink_ErrorOtherTitle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('deepLink_ErrorOtherDescription'),
    ).toBeInTheDocument();
  });

  it('renders the missing URL state without a destination', async () => {
    mockUseLocation.mockReturnValue(createLocation(''));

    render(<DeepLink />);

    expect(
      await screen.findByText('deepLink_ErrorMissingUrl'),
    ).toBeInTheDocument();
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('renders the unsigned 404 state without a destination', async () => {
    mockUseLocation.mockReturnValue(createLocation('?errorCode=404'));

    render(<DeepLink />);

    expect(
      await screen.findByText('deepLink_Error404Title'),
    ).toBeInTheDocument();
    expect(screen.queryByText('deepLink_Error404_CTA')).not.toBeInTheDocument();
    expect(mockParse).not.toHaveBeenCalled();
  });

  it('parses before rendering a URL-supplied error state', async () => {
    mockUseLocation.mockReturnValue(
      createLocation('?u=%2Fbuy&errorCode=unexpected'),
    );
    mockParse.mockResolvedValue(createParsedDeepLink('/buy'));

    render(<DeepLink />);

    expect(
      await screen.findByText('deepLink_ErrorMissingUrl'),
    ).toBeInTheDocument();
    expect(mockParse).toHaveBeenCalledTimes(1);
  });

  it('updates the signed-link preference from the checkbox', async () => {
    mockUseLocation.mockReturnValue(createLocation('?u=%2Fbuy'));
    mockParse.mockResolvedValue(createParsedDeepLink('/buy'));

    render(<DeepLink />);

    fireEvent.click(await screen.findByTestId('deep-link-checkbox'));

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('hides stale interstitial content while a different URL is parsed', async () => {
    let currentSearch = '?u=%2Fbuy';
    mockUseLocation.mockImplementation(() => createLocation(currentSearch));
    mockParse.mockResolvedValueOnce(createParsedDeepLink('/buy'));

    const { rerender } = render(<DeepLink />);

    await waitFor(() => {
      expect(
        screen.getByTestId('deep-link-continue-button'),
      ).toBeInTheDocument();
    });

    const nextParse =
      createDeferredPromise<Awaited<ReturnType<typeof parse>>>();
    mockParse.mockReturnValueOnce(nextParse.promise);
    currentSearch = '?u=%2Fhome';

    rerender(<DeepLink />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(
      screen.queryByTestId('deep-link-continue-button'),
    ).not.toBeInTheDocument();

    nextParse.resolve(createParsedDeepLink('/home'));

    await waitFor(() => {
      expect(
        screen.getByTestId('deep-link-continue-button'),
      ).toBeInTheDocument();
    });
  });
});
