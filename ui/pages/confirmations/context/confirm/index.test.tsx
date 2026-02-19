import React from 'react';
import { render, waitFor } from '@testing-library/react';

import {
  DEFAULT_ROUTE,
  PERPS_HOME_ROUTE,
} from '../../../../helpers/constants/routes';

let mockLocationState: unknown;
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

let mockCurrentConfirmation: unknown = { id: 'mock-confirmation' };

jest.mock('../../hooks/useCurrentConfirmation', () => () => ({
  currentConfirmation: mockCurrentConfirmation,
}));

jest.mock('../../hooks/useSyncConfirmPath', () => () => undefined);

// eslint-disable-next-line import/first
import { ConfirmContextProvider } from '.';

describe('ConfirmContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationState = undefined;
    mockCurrentConfirmation = { id: 'mock-confirmation' };
  });

  it('navigates to returnTo when confirmation disappears', async () => {
    mockLocationState = { returnTo: PERPS_HOME_ROUTE };

    const { rerender } = render(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    expect(mockNavigate).not.toHaveBeenCalled();

    mockCurrentConfirmation = undefined;
    rerender(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(PERPS_HOME_ROUTE, {
        replace: true,
      });
    });
  });

  it('falls back to Activity when no returnTo is provided', async () => {
    const { rerender } = render(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    mockCurrentConfirmation = undefined;
    rerender(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          replace: true,
        },
      );
    });
  });

  it('falls back to Activity when returnTo is outside allowed perps routes', async () => {
    mockLocationState = { returnTo: '/settings' };

    const { rerender } = render(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    mockCurrentConfirmation = undefined;
    rerender(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          replace: true,
        },
      );
    });
  });

  it('falls back to Activity when returnTo is malformed', async () => {
    mockLocationState = { returnTo: 'https://example.com' };

    const { rerender } = render(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    mockCurrentConfirmation = undefined;
    rerender(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          replace: true,
        },
      );
    });
  });

  it('falls back to Activity when returnTo is not a string', async () => {
    mockLocationState = { returnTo: 1234 };

    const { rerender } = render(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    mockCurrentConfirmation = undefined;
    rerender(
      <ConfirmContextProvider>
        <div />
      </ConfirmContextProvider>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          replace: true,
        },
      );
    });
  });
});
