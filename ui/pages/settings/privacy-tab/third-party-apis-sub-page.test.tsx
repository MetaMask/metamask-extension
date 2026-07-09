import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen } from '@testing-library/react';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import ThirdPartyApisSubPage from './third-party-apis-sub-page';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('ThirdPartyApisSubPage', () => {
  const mockStore = configureMockStore([thunk])(mockState);
  const createStore = (
    remoteFeatureFlags = {},
    isBasicFunctionalityConsolidatedEnabled = false,
  ) =>
    configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags,
        preferences: {
          ...mockState.metamask.preferences,
          isBasicFunctionalityConsolidatedEnabled,
        },
      },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(
        <ThirdPartyApisSubPage />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });

  it('redirects when consolidated Basic Functionality is enabled', () => {
    renderWithProvider(
      <ThirdPartyApisSubPage />,
      createStore({ extensionBasicFunctionalityToggle: true }, true),
    );

    expect(screen.queryByTestId('ipfs-gateway-toggle')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('network-details-check-toggle'),
    ).not.toBeInTheDocument();
  });
});
