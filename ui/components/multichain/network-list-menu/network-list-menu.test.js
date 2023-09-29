/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { NetworkListMenu } from '.';

const mockSetShowTestNetworks = jest.fn();
const mockSetProviderType = jest.fn();
const mockToggleNetworkMenu = jest.fn();
jest.mock('../../../store/actions.ts', () => ({
  setShowTestNetworks: () => mockSetShowTestNetworks,
  setProviderType: () => mockSetProviderType,
  toggleNetworkMenu: () => mockToggleNetworkMenu,
}));

const render = (
  showTestNetworks = false,
  currentChainId = '0x5',
  providerConfigId = 'chain5',
  isUnlocked = true,
) => {
  const state = {
    metamask: {
      ...mockState.metamask,
      isUnlocked,
      providerConfig: {
        ...mockState.metamask.providerConfig,
        chainId: currentChainId,
        id: providerConfigId,
      },
      preferences: {
        showTestNetworks,
      },
    },
  };

  const store = configureStore(state);
  return renderWithProvider(<NetworkListMenu onClose={jest.fn()} />, store);
};

describe('NetworkListMenu', () => {
  it('displays important controls', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
