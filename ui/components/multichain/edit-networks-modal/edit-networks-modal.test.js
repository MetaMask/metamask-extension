import React from 'react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { EditNetworksModal } from '.';

const mockSetShowTestNetworks = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  setShowTestNetworks: () => mockSetShowTestNetworks,
}));

const render = ({
  showTestNetworks = false,
  currentChainId = '0x5',
  providerConfigId = 'chain5',
  isUnlocked = true,
} = {}) => {
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
      useRequestQueue: true,
    },
    activeTab: {
      origin,
    },
  };

  const store = configureStore(state);
  return renderWithProvider(<EditNetworksModal onClose={jest.fn()} />, store);
};
describe('EditNetworksModal', () => {
  it('renders properly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
  it('should render correctly', () => {
    const { getByText } = render();
    expect(getByText('Edit networks')).toBeInTheDocument();
  });
});
