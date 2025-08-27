import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import { ConnectedSitePopover } from './connected-site-popover';

const props = {
  referenceElement: { current: document.createElement('div') },
  isOpen: true,
  isConnected: true,
  onClick: jest.fn(),
  onClose: jest.fn(),
};

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      // Add multichain network state
      selectedMultichainNetworkChainId: 'eip155:5',
      isEvmSelected: true,
      multichainNetworkConfigurationsByChainId: {
        ...mockState.metamask.multichainNetworkConfigurationsByChainId,
        'eip155:5': {
          chainId: 'eip155:5',
          name: 'Goerli',
          nativeCurrency: 'ETH',
          isEvm: true,
        },
      },
      // Add permissions for the test dapp
      subjects: {
        'https://metamask.github.io': {
          permissions: {
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:5': {
                        accounts: [
                          'eip155:5:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                        ],
                      },
                    },
                    isMultichainOrigin: false,
                  },
                },
              ],
            },
          },
        },
      },
    },
    activeTab: {
      id: 113,
      title: 'E2E Test Dapp',
      origin: 'https://metamask.github.io',
      protocol: 'https:',
      url: 'https://metamask.github.io/test-dapp/',
    },
  });
  return renderWithProvider(<ConnectedSitePopover {...props} />, store);
};

describe('ConnectedSitePopover', () => {
  it('renders the popover when isOpen is true', () => {
    const { getByTestId } = render();
    expect(getByTestId('connected-site-popover')).toBeInTheDocument();
  });

  it('displays site name correctly', () => {
    const { getByText } = render();
    expect(getByText('metamask.github.io')).toBeInTheDocument();
  });

  it('triggers onClick when manage permissions button is clicked', () => {
    const { getByText } = render();
    fireEvent.click(getByText('Manage permissions'));
    expect(props.onClick).toHaveBeenCalled();
  });

  it('shows network name when connected', () => {
    const { getByText } = render();
    expect(getByText('Goerli')).toBeInTheDocument();
  });
});
