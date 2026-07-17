import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import DebugContent from '.';

const mockPerpsToggleTestnet = jest.fn().mockResolvedValue(undefined);
const mockRemoteFeatureFlags = { feature1: 'value1' };
// eslint-disable-next-line
/* @ts-expect-error: Avoids error from window property not existing */
window.metamaskFeatureFlags = {};

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getManifest: jest.fn().mockReturnValue({ version: '1.0.0' }),
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue({}),
    },
    onChanged: { addListener: jest.fn(), removeListener: jest.fn() },
  },
}));

jest.mock('../../../../store/actions.ts', () => ({
  perpsToggleTestnet: () => mockPerpsToggleTestnet(),
}));

jest.mock('../../../../../shared/lib/selectors/remote-feature-flags', () => ({
  getRemoteFeatureFlags: jest.fn(() => mockRemoteFeatureFlags),
}));

jest.mock('../../../../selectors/perps-controller', () => ({
  selectPerpsIsTestnet: jest.fn(() => false),
}));

describe('Debug tab', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  it('renders remote feature flags', () => {
    const { getByTestId } = renderWithProvider(<DebugContent />, mockStore);
    expect(
      getByTestId('developer-options-remote-feature-flags').textContent,
    ).toEqual(JSON.stringify(mockRemoteFeatureFlags, null, 2));
  });

  describe('Perps Testnet toggle (METAMASK_DEBUG only)', () => {
    const originalMetaMaskDebug = process.env.METAMASK_DEBUG;

    afterEach(() => {
      if (originalMetaMaskDebug === undefined) {
        delete process.env.METAMASK_DEBUG;
      } else {
        process.env.METAMASK_DEBUG = originalMetaMaskDebug;
      }
    });

    it('does not render perps-testnet-toggle when METAMASK_DEBUG is not set', () => {
      delete process.env.METAMASK_DEBUG;
      const { queryByTestId } = renderWithProvider(<DebugContent />, mockStore);
      expect(queryByTestId('perps-testnet-toggle')).not.toBeInTheDocument();
    });

    it('renders perps-testnet-toggle when METAMASK_DEBUG is set', () => {
      process.env.METAMASK_DEBUG = 'true';
      const { getByTestId } = renderWithProvider(<DebugContent />, mockStore);
      expect(getByTestId('perps-testnet-toggle')).toBeInTheDocument();
    });

    it('calls perpsToggleTestnet when toggle is clicked', () => {
      process.env.METAMASK_DEBUG = 'true';
      const { getByTestId } = renderWithProvider(<DebugContent />, mockStore);
      fireEvent.click(getByTestId('perps-testnet-toggle'));
      expect(mockPerpsToggleTestnet).toHaveBeenCalled();
    });
  });
});
