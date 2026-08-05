import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import Assets from './assets-tab';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('Assets Tab', () => {
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
      const { container } = renderWithProvider(<Assets />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  it('hides asset API toggles when consolidated Basic Functionality is enabled', () => {
    renderWithProvider(
      <Assets />,
      createStore({ extensionBasicFunctionalityToggle: true }, true),
    );

    expect(
      screen.getByTestId('show-native-token-as-main-balance-toggle'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('use-nft-detection-input'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('autodetect-tokens')).not.toBeInTheDocument();
  });
});
