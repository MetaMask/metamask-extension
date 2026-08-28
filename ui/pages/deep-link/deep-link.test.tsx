import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { createDeferredPromise } from '@metamask/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  type ParsedDeepLink,
  parse,
} from '../../../shared/lib/deep-links/parse';
import { verify } from '../../../shared/lib/deep-links/verify';
import { DeepLink } from './deep-link';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
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

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockTranslate,
}));

jest.mock('../../store/hooks', () => ({
  useDispatch: () => jest.fn(),
}));

jest.mock('../../../shared/lib/selectors/preferences', () => ({
  getPreferences: () => ({ skipDeepLinkInterstitial: false }),
}));

const mockUseLocation = jest.mocked(useLocation);
const mockUseNavigate = jest.mocked(useNavigate);
const mockUseSelector = jest.mocked(useSelector);
const mockParse = jest.mocked(parse);
const mockVerify = jest.mocked(verify);
const mockNavigate = jest.fn();
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
    mockUseNavigate.mockReturnValue(mockNavigate);
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
    expect(mockNavigate).toHaveBeenCalledWith(
      {
        pathname: '/link',
        search: '?u=%2Fbuy%3Famount%3D1',
        hash: '',
      },
      { replace: true },
    );
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
