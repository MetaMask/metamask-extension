import React from 'react';
import { useSelector } from 'react-redux';

import { NetworkFilterDropdownItem } from '.';
import { getNetworkConfigurationsByChainId } from '../../../../../../../shared/modules/selectors/networks';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { getCurrentNetwork } from '../../../../../../selectors';

// Mock react-redux useSelector
jest.mock('react-redux', () => {
  const originalModule = jest.requireActual('react-redux');
  return {
    ...originalModule,
    useSelector: jest.fn(),
  };
});
const mockOpenListNetwork = jest.fn();

const renderComponent = () => {
  (useSelector as jest.Mock).mockImplementation((selector) => {
    if (selector === getCurrentNetwork) {
      return {
        nickname: 'Mock Network',
      };
    }
    if (selector === getNetworkConfigurationsByChainId) {
      return {
        chainId: '0x1',
        nickname: 'Mock Network',
      };
    }
    return undefined;
  });

  return renderWithProvider(
    <NetworkFilterDropdownItem
      isCurrentNetwork
      openListNetwork={mockOpenListNetwork}
      currentNetworkImageUrl="http://current-network.com"
      allOpts={{}}
      setDropdownOpen={() => ({})}
    />,
  );
};

describe('NetworkFilterDropdownItem', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders current network correctly and matches snapshot', () => {
    const { container, getByText } = renderComponent();

    // Verify the nickname is rendered
    expect(getByText('Mock Network')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
