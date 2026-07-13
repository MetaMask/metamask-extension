import { screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import PrivacyTab from './privacy-tab';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('PrivacyTab', () => {
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
      const { container } = renderWithProvider(<PrivacyTab />, mockStore);

      expect(container).toMatchSnapshot();
    });
  });

  it('hides granular privacy controls when consolidated Basic Functionality is enabled', () => {
    renderWithProvider(
      <PrivacyTab />,
      createStore({ extensionBasicFunctionalityToggle: true }, true),
    );

    expect(
      screen.getByTestId('basic-functionality-toggle'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('ipfs-gateway-toggle')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.thirdPartyApis.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('batch-account-balance-requests-toggle'),
    ).not.toBeInTheDocument();
  });

  it('keeps existing Privacy settings when the remote flag is enabled without the local cohort marker', () => {
    renderWithProvider(
      <PrivacyTab />,
      createStore({ extensionBasicFunctionalityToggle: true }, false),
    );

    expect(
      screen.getByText(messages.thirdPartyApis.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    ).toBeInTheDocument();
  });
});
