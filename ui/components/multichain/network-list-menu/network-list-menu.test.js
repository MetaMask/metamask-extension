/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { NetworkListMenu } from '.';

const mockSetShowTestNetworks = jest.fn();
const mockSetProviderType = jest.fn();
jest.mock('../../../store/actions.ts', () => ({
  setShowTestNetworks: () => mockSetShowTestNetworks,
  setProviderType: () => mockSetProviderType,
}));

const render = (showTestNetworks = false) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      preferences: {
        showTestNetworks,
      },
    },
  });
  return renderWithProvider(<NetworkListMenu closeMenu={jest.fn()} />, store);
};

describe('NetworkListMenu', () => {
  it('displays important controls', () => {
    const { getByText } = render();

    expect(getByText('Add network')).toBeInTheDocument();
    expect(getByText('Show test networks')).toBeInTheDocument();
  });

  it('renders mainnet item', () => {
    const { getByText } = render();
    expect(getByText(MAINNET_DISPLAY_NAME)).toBeInTheDocument();
  });

  it('renders test networks when it should', () => {
    const { getByText } = render(true);
    expect(getByText(SEPOLIA_DISPLAY_NAME)).toBeInTheDocument();
  });

  it('toggles showTestNetworks when toggle is clicked', () => {
    const { queryAllByRole } = render();
    const [testNetworkToggle] = queryAllByRole('checkbox');
    fireEvent.click(testNetworkToggle);
    expect(mockSetShowTestNetworks).toHaveBeenCalled();
  });

  it('switches networks when an item is clicked', () => {
    const { getByText } = render();
    fireEvent.click(getByText(MAINNET_DISPLAY_NAME));
    expect(mockSetProviderType).toHaveBeenCalled();
  });
});
