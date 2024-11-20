import React from 'react';
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

  it('renders component when the state property is true', () => {
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
    const { container } = renderWithConfirmContextProvider(
      <AdvancedDetails />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders component when the prop override is passed', () => {
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
      <AdvancedDetails overrideVisibility />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
