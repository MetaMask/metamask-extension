import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { tEn } from '../../../../../test/lib/i18n-helpers';
import {
  en,
  I18nProvider,
} from '../../../../../test/lib/render-helpers-navigate';
import {
  PERPS_CONFIRMATION_STARTUP_FLOW,
  PERPS_STARTUP_ERROR_ROUTE_STATE_KEY,
  type PerpsConfirmationStartupFlow,
} from '../../../../pages/confirmations/constants/perps';
import { PerpsStartupErrorToastListener } from './perps-startup-error-toast-listener';
import { PerpsToastProvider } from './perps-toast-provider';

const mockTriggerPerpsWithdrawNavigation = jest.fn();

jest.mock('../hooks/usePerpsWithdrawNavigation', () => ({
  usePerpsWithdrawNavigation: () => ({
    trigger: mockTriggerPerpsWithdrawNavigation,
    isLoading: false,
  }),
}));

const renderStartupErrorToastListener = (
  startupError: PerpsConfirmationStartupFlow,
  extraState: Record<string, unknown> = {},
) => {
  const router = createMemoryRouter(
    [
      {
        path: '/perps/trade/:symbol',
        element: (
          <I18nProvider currentLocale="en" current={en} en={en}>
            <PerpsToastProvider>
              <PerpsStartupErrorToastListener />
              <div>Perps route</div>
            </PerpsToastProvider>
          </I18nProvider>
        ),
      },
    ],
    {
      initialEntries: [
        {
          pathname: '/perps/trade/BTC',
          state: {
            ...extraState,
            [PERPS_STARTUP_ERROR_ROUTE_STATE_KEY]: startupError,
          },
        },
      ],
      future: {
        /* eslint-disable @typescript-eslint/naming-convention */
        v7_relativeSplatPath: true,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    },
  );

  render(
    <RouterProvider
      router={router}
      future={{
        /* eslint-disable @typescript-eslint/naming-convention */
        v7_startTransition: true,
        /* eslint-enable @typescript-eslint/naming-convention */
      }}
    />,
  );

  return router;
};

describe('PerpsStartupErrorToastListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTriggerPerpsWithdrawNavigation.mockResolvedValue({
      route: '/confirm-transaction/withdraw-tx-id',
    });
  });

  it('shows deposit startup error toast and clears only the startup error route state', async () => {
    const router = renderStartupErrorToastListener(
      PERPS_CONFIRMATION_STARTUP_FLOW.DEPOSIT,
      { preserved: 'state' },
    );

    expect(
      await screen.findByText(tEn('perpsDepositToastErrorTitle')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('perpsDepositToastErrorDescription')),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(router.state.location.state).toStrictEqual({
        preserved: 'state',
      });
    });
    expect(mockTriggerPerpsWithdrawNavigation).not.toHaveBeenCalled();
  });

  it('shows retryable withdraw startup error toast and clears route state', async () => {
    const router = renderStartupErrorToastListener(
      PERPS_CONFIRMATION_STARTUP_FLOW.WITHDRAW,
    );

    expect(
      await screen.findByText(tEn('perpsWithdrawStartErrorTitle')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tEn('perpsWithdrawStartErrorDescription')),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: tEn('tryAgain') }));

    expect(mockTriggerPerpsWithdrawNavigation).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(router.state.location.state).not.toEqual(
        expect.objectContaining({
          [PERPS_STARTUP_ERROR_ROUTE_STATE_KEY]: expect.any(String),
        }),
      );
    });
  });
});
