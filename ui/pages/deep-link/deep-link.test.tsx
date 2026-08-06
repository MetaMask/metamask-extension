import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { parse } from '../../../shared/lib/deep-links/parse';
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

describe('DeepLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pendingDeepLinkRequestIds = [];
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseSelector.mockImplementation((selector) =>
      selector({
        appState: { pendingDeepLinkRequestIds },
      } as never),
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
    mockUseLocation.mockReturnValue({
      pathname: '/link',
      search: '?u=%2Fbuy&id=request-1',
      hash: '',
      key: '',
      state: undefined,
    } as ReturnType<typeof useLocation>);

    mockParse.mockResolvedValue({
      destination: {
        path: '/buy',
        query: new URLSearchParams(),
      },
      signature: 'valid',
      route: {
        getTitle: () => 'deepLink_theBuyPage',
      },
    } as never);

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
    mockUseLocation.mockImplementation(
      () =>
        ({
          pathname: '/link',
          search: currentSearch,
          hash: '',
          key: '',
          state: undefined,
        }) as ReturnType<typeof useLocation>,
    );

    mockParse.mockResolvedValue({
      destination: {
        path: '/buy',
        query: new URLSearchParams('amount=1'),
      },
      signature: 'valid',
      route: {
        getTitle: () => 'deepLink_theBuyPage',
      },
    } as never);

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
    mockUseLocation.mockReturnValue({
      pathname: '/link',
      search: '?u=%2Fbuy%3Famount%3D1',
      hash: '',
      key: '',
      state: undefined,
    } as ReturnType<typeof useLocation>);

    mockParse.mockResolvedValue({
      destination: {
        path: '/buy',
        query: new URLSearchParams('amount=1'),
      },
      signature: 'valid',
      route: {
        getTitle: () => 'deepLink_theBuyPage',
      },
    } as never);

    render(<DeepLink />);

    await waitFor(() => {
      expect(mockParse).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId('deep-link-continue-button'),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId('deep-link-checkbox')).toBeInTheDocument();
  });
});
