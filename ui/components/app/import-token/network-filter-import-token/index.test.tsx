import { screen } from '@testing-library/react';
import React from 'react';
import configureStore from 'redux-mock-store';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';

import { NetworkFilterImportToken } from '.';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { getIsTokenNetworkFilterEqualCurrentNetwork } from '../../../../selectors/selectors';

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

describe('NetworkFilterImportToken', () => {
  const store = configureStore()(mockState);

  (useSelector as jest.Mock).mockImplementation((selector) => {
    if (selector === getIsTokenNetworkFilterEqualCurrentNetwork) {
      return true;
    }
    if (selector === getNetworkConfigurationsByChainId) {
      return mockNetworkState(
        { chainId: CHAIN_IDS.MAINNET },
        { chainId: CHAIN_IDS.GOERLI },
      );
    }
    return undefined;
  });

  const props = {
    buttonDataTestId: 'mockButtonDataTestId',
    title: 'mockTitle',
    openListNetwork: jest.fn(),
  };

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <NetworkFilterImportToken {...props} />,
      store,
    );
    expect(screen.getByText('Current network')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should renders "popular networks" text when isTokenNetworkFilterEqualCurrentNetwork is true', () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getIsTokenNetworkFilterEqualCurrentNetwork) {
        return false;
      }
      if (selector === getNetworkConfigurationsByChainId) {
        return mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.GOERLI },
        );
      }
      return undefined;
    });
    const { container } = renderWithProvider(
      <NetworkFilterImportToken {...props} />,
      store,
    );
    expect(screen.getByText('Popular networks')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
});
