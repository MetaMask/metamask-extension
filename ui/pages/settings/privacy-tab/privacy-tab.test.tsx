import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  DEFAULT_SETTING_ANCHOR,
  SETTING_ANCHORS,
} from '../../../../shared/lib/deep-links/routes/privacy';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import PrivacyTab, {
  CONSOLIDATED_BASIC_FUNCTIONALITY_PRIVACY_ITEMS,
  PRIVACY_SETTING_ITEMS,
} from './privacy-tab';

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

  it('keeps privacy deeplink anchors in sync with settings item ids', () => {
    const ids = PRIVACY_SETTING_ITEMS.map((item) => item.id);
    const consolidatedIds = CONSOLIDATED_BASIC_FUNCTIONALITY_PRIVACY_ITEMS.map(
      (item) => item.id,
    );

    expect(ids).toContain(DEFAULT_SETTING_ANCHOR);
    expect(SETTING_ANCHORS.has(DEFAULT_SETTING_ANCHOR)).toBe(true);

    for (const anchor of SETTING_ANCHORS) {
      expect(ids).toContain(anchor);
      expect(consolidatedIds).toContain(anchor);
    }
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

  it('shows an error when the user enters an Infura IPFS gateway', () => {
    renderWithProvider(<PrivacyTab />, mockStore);

    fireEvent.change(screen.getByDisplayValue('dweb.link'), {
      target: { value: 'ipfs.infura.io' },
    });

    expect(
      screen.getByText(messages.forbiddenIpfsGateway.message),
    ).toBeInTheDocument();
  });
});
