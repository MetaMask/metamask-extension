/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { BuyDeepLinkGate } from './buy-deeplink-gate';

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

const mockGetEnvironmentType = getEnvironmentType as jest.Mock;
const mockReplace = jest.fn();
const mockOpenTab = jest.fn();

const SEARCH = '?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';

const PORTFOLIO_URL =
  'https://app.metamask.io/buy?address=0x6b175474e89094c44da98b954eedeac495271d0f&chainId=1';

function renderGate(rampsEnabled: boolean, strict = false) {
  const store = configureMockStore([thunk])({
    metamask: { remoteFeatureFlags: { rampsEnabled } },
  });
  const router = createMemoryRouter(
    [
      {
        path: '/ramps/buy-deeplink-entry',
        element: <BuyDeepLinkGate />,
        children: [{ index: true, element: <div data-testid="entry-page" /> }],
      },
    ],
    {
      initialEntries: [`/ramps/buy-deeplink-entry${SEARCH}`],
      future: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        v7_relativeSplatPath: true,
      },
    },
  );

  const tree = (
    <Provider store={store}>
      <RouterProvider
        router={router}
        // eslint-disable-next-line @typescript-eslint/naming-convention
        future={{ v7_startTransition: true }}
      />
    </Provider>
  );

  return render(strict ? <React.StrictMode>{tree}</React.StrictMode> : tree);
}

describe('BuyDeepLinkGate', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: { replace: mockReplace },
      writable: true,
    });
    Object.defineProperty(global, 'platform', {
      value: { openTab: mockOpenTab },
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces a fullscreen tab with Portfolio carrying the link params when the flag is off', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    renderGate(false);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PORTFOLIO_URL);
    });
    expect(mockOpenTab).not.toHaveBeenCalled();
    expect(screen.queryByTestId('entry-page')).not.toBeInTheDocument();
  });

  it('opens Portfolio in a new tab from a popup when the flag is off', async () => {
    mockGetEnvironmentType.mockReturnValue('popup');
    renderGate(false);

    await waitFor(() => {
      expect(mockOpenTab).toHaveBeenCalledWith({ url: PORTFOLIO_URL });
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('opens only one Portfolio tab under StrictMode', async () => {
    mockGetEnvironmentType.mockReturnValue('popup');
    renderGate(false, true);

    await waitFor(() => {
      expect(mockOpenTab).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the authenticated entry page when the flag is on', () => {
    renderGate(true);

    expect(screen.getByTestId('entry-page')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockOpenTab).not.toHaveBeenCalled();
  });
});
