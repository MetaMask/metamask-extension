import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { PermissionsCellTooltip } from './permissions-cell-tooltip';

describe('PermissionsCellTooltip', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const mockNetworks = [
    {
      chainId: '0x1',
      name: 'Ethereum Mainnet',
    },
    {
      chainId: '0x89',
      name: 'Polygon',
    },
    {
      chainId: '0xa86a',
      name: 'Avalanche C-Chain',
    },
    {
      chainId: '0x38',
      name: 'BNB Smart Chain',
    },
    {
      chainId: '0xaa36a7',
      name: 'Sepolia',
    },
  ];

  const defaultProps = {
    networks: mockNetworks,
  };

  it('renders correctly with networks', () => {
    const { container } = renderWithProvider(
      <PermissionsCellTooltip {...defaultProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders AvatarGroup with correct props', () => {
    const { container } = renderWithProvider(
      <PermissionsCellTooltip {...defaultProps} />,
      store,
    );

    const avatarGroup = container.querySelector('.mm-avatar-group');
    expect(avatarGroup).toBeDefined();
  });

  it('handles empty networks array', () => {
    const props = {
      networks: [],
    };

    const { container } = renderWithProvider(
      <PermissionsCellTooltip {...props} />,
      store,
    );

    expect(container.firstChild).toBeNull();
  });
});
