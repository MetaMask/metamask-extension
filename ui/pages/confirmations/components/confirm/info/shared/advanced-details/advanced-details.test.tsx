import React, { Suspense } from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { AdvancedDetails } from './advanced-details';

describe('<AdvancedDetails />', () => {
  const middleware = [thunk];

  it('does not render component when the state property is false', () => {
    const state = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showConfirmationAdvancedDetails: false,
        },
      },
    };

    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <AdvancedDetails />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders component when the state property is true', async () => {
    const state = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showConfirmationAdvancedDetails: true,
        },
      },
    };

    const mockStore = configureMockStore(middleware)(state);
    const { container, findByTestId } = renderWithConfirmContextProvider(
      <Suspense fallback={null}>
        <AdvancedDetails />
      </Suspense>,
      mockStore,
    );

    await findByTestId('advanced-details-nonce-section');
    expect(container).toMatchSnapshot();
  });

  it('renders component when the prop override is passed', async () => {
    const state = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showConfirmationAdvancedDetails: false,
        },
      },
    };

    const mockStore = configureMockStore(middleware)(state);
    const { container, findByTestId } = renderWithConfirmContextProvider(
      <Suspense fallback={null}>
        <AdvancedDetails overrideVisibility />
      </Suspense>,
      mockStore,
    );

    await findByTestId('advanced-details-nonce-section');
    expect(container).toMatchSnapshot();
  });
});
