import React from 'react';
import { it } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import rewardsMoney, { initialState } from '#ui/ducks/rewards-money';
import { RootLayout } from '#ui/layouts/root-layout';

jest.mock('#shared/lib/manifestFlags', () => ({
  getManifestFlags: () => ({}),
}));
jest.mock('#ui/selectors/home-modals', () => ({
  selectShowTermsOfUse: (state: { appState: { termsOpen: boolean } }) =>
    state.appState.termsOpen,
}));
jest.mock(
  '#ui/components/app/rewards/money-referral/AcceptInviteSheet',
  () => ({
    AcceptInviteSheet: ({
      initialCode,
      onClose,
    }: {
      initialCode: string;
      onClose: () => void;
    }) => <button onClick={onClose}>{initialCode}</button>,
  }),
);

function renderInvite({
  enabled = true,
  externalServices = true,
  termsOpen = false,
  route = '/money',
} = {}) {
  const store = configureStore({
    reducer: {
      rewardsMoney,
      metamask: () => ({
        useExternalServices: externalServices,
        remoteFeatureFlags: {
          rewardsMoneyControllerEnabled: { enabled, minimumVersion: '0.0.0' },
        },
      }),
      appState: () => ({ termsOpen }),
    },
    preloadedState: {
      rewardsMoney: { ...initialState, pendingReferralCode: 'ABC123' },
    },
  });
  const router = createMemoryRouter(
    [
      {
        element: <RootLayout />,
        children: [{ path: '*', element: <div>Destination</div> }],
      },
    ],
    { initialEntries: [route] },
  );
  render(
    <Provider store={store}>
      <RouterProvider
        router={router}
        // eslint-disable-next-line @typescript-eslint/naming-convention -- React Router API
        future={{ v7_startTransition: true }}
      />
    </Provider>,
  );
  return store;
}

describe('ReferralInvite', () => {
  it('opens over the destination and clears the pending code on close', () => {
    const store = renderInvite({ termsOpen: true, route: '/' });

    expect(screen.getByText('Destination')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ABC123' }));

    expect(store.getState().rewardsMoney.pendingReferralCode).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Destination')).toBeInTheDocument();
  });

  it.each([{ enabled: false }, { externalServices: false }])(
    'waits while the invite cannot be shown: %j',
    (options) => {
      const store = renderInvite(options);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(store.getState().rewardsMoney.pendingReferralCode).toBe('ABC123');
    },
  );
});
