import React from 'react';
import configureStore from 'redux-mock-store';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NetworkFilterImportToken from '.';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getPreferences,
} from '../../../../selectors/selectors';
import { useDispatch, useSelector } from 'react-redux';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';

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
