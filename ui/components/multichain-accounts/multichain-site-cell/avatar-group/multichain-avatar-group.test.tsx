import React from 'react';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import {
  MultichainAvatarGroup,
  MultichainAvatarGroupType,
} from './multichain-avatar-group';

const TEST_IDS = {
  AVATAR_GROUP: 'avatar-group',
  AVATAR_ACCOUNT: (index: number) => `avatar-${index}`,
  NETWORK_AVATAR: (index: number) => `network-avatar-${index}`,
} as const;

describe('MultichainAvatarGroup', () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });

  const mockAvatar1 = {
    avatarValue: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    symbol: 'ETH',
  };

  const mockAvatar2 = {
    avatarValue: '0x123456789abcdef0123456789abcdef012345678',
    symbol: 'MATIC',
  };

  const mockAvatar3 = {
    avatarValue: '0xabcdef1234567890abcdef1234567890abcdef12',
    symbol: 'BNB',
  };

  const mockAvatar4 = {
    avatarValue: '0x987654321fedcba0987654321fedcba0987654321',
    symbol: 'USDC',
  };

  const mockAvatar5 = {
    avatarValue: '0x5555555555555555555555555555555555555555',
    symbol: 'DAI',
  };

  const mockMembers = [mockAvatar1, mockAvatar2, mockAvatar3];

  const mockNetwork1 = {
    avatarValue: 'https://example.com/ethereum-icon.png',
    symbol: 'Ethereum',
  };

  const mockNetwork2 = {
    avatarValue: 'https://example.com/polygon-icon.png',
    symbol: 'Polygon',
  };

  const mockNetwork3 = {
    avatarValue: 'https://example.com/bsc-icon.png',
    symbol: 'BSC',
  };

  const mockNetwork4 = {
    avatarValue: 'https://example.com/avalanche-icon.png',
    symbol: 'Avalanche',
  };

  const mockNetwork5 = {
    avatarValue: 'https://example.com/arbitrum-icon.png',
    symbol: 'Arbitrum',
  };

  const mockNetworkMembers = [mockNetwork1, mockNetwork2, mockNetwork3];

  const defaultProps = {
    members: mockMembers,
    type: MultichainAvatarGroupType.ACCOUNT,
  };

  const defaultNetworkProps = {
    members: mockNetworkMembers,
    type: MultichainAvatarGroupType.NETWORK,
  };

  it('renders avatar group with correct test id', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup {...defaultProps} />,
      store,
    );

    const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
    expect(avatarGroup).toBeInTheDocument();
  });

  it('renders correct number of avatars based on limit', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup {...defaultProps} limit={2} />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toThrow();
  });

  it('renders all avatars when limit is greater than members count', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup {...defaultProps} limit={10} />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toThrow();
  });

  it('applies custom className', () => {
    const customClassName = 'custom-avatar-group';
    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup {...defaultProps} className={customClassName} />,
      store,
    );

    const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
    expect(avatarGroup).toHaveClass(customClassName);
  });

  it('renders with default limit when not provided', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup {...defaultProps} />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toThrow();
  });

  it('renders empty avatar group when no members provided', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup
        type={MultichainAvatarGroupType.ACCOUNT}
        members={[]}
      />,
      store,
    );

    const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
    expect(avatarGroup).toBeInTheDocument();

    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toThrow();
  });

  it('handles members with only avatarValue (no symbol)', () => {
    const membersWithoutSymbol = [
      {
        avatarValue: mockAvatar1.avatarValue,
      },
      {
        avatarValue: mockAvatar2.avatarValue,
      },
    ];

    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup
        type={MultichainAvatarGroupType.ACCOUNT}
        members={membersWithoutSymbol}
      />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toThrow();
  });

  it('handles large number of members with limit', () => {
    const manyMembers = [
      mockAvatar1,
      mockAvatar2,
      mockAvatar3,
      mockAvatar4,
      mockAvatar5,
    ];

    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup
        type={MultichainAvatarGroupType.ACCOUNT}
        members={manyMembers}
        limit={4}
      />,
      store,
    );

    // Should render only 4 avatars due to limit
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(4))).toThrow();
  });

  it('handles many members with generated data', () => {
    const manyMembers = Array.from({ length: 10 }, (_, index) => ({
      avatarValue: `0x${index.toString().padStart(40, '0')}`,
      symbol: `TOKEN${index}`,
    }));

    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup
        type={MultichainAvatarGroupType.ACCOUNT}
        members={manyMembers}
        limit={4}
      />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(4))).toThrow();
  });

  it('respects default limit of 4 when members exceed limit', () => {
    const manyMembers = [
      mockAvatar1,
      mockAvatar2,
      mockAvatar3,
      mockAvatar4,
      mockAvatar5,
    ];

    const { getByTestId } = renderWithProvider(
      <MultichainAvatarGroup
        type={MultichainAvatarGroupType.ACCOUNT}
        members={manyMembers}
      />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(4))).toThrow();
  });

  describe('Network Avatar Group', () => {
    it('renders network avatar group with correct test id', () => {
      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup {...defaultNetworkProps} />,
        store,
      );

      const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
      expect(avatarGroup).toBeInTheDocument();
    });

    it('renders network avatars with correct test ids', () => {
      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup {...defaultNetworkProps} />,
        store,
      );

      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(3))).toThrow();
    });

    it('renders correct number of network avatars based on limit', () => {
      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup {...defaultNetworkProps} limit={2} />,
        store,
      );

      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toThrow();
    });

    it('renders all network avatars when limit is greater than members count', () => {
      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup {...defaultNetworkProps} limit={10} />,
        store,
      );

      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(3))).toThrow();
    });

    it('applies custom className to network avatar group', () => {
      const customClassName = 'custom-network-avatar-group';
      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup
          {...defaultNetworkProps}
          className={customClassName}
        />,
        store,
      );

      const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
      expect(avatarGroup).toHaveClass(customClassName);
    });

    it('renders with default limit when not provided for networks', () => {
      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup {...defaultNetworkProps} />,
        store,
      );

      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(3))).toThrow();
    });

    it('renders empty network avatar group when no members provided', () => {
      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup
          type={MultichainAvatarGroupType.NETWORK}
          members={[]}
        />,
        store,
      );

      const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
      expect(avatarGroup).toBeInTheDocument();

      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toThrow();
    });

    it('handles network members with only avatarValue (no symbol)', () => {
      const networksWithoutSymbol = [
        {
          avatarValue: mockNetwork1.avatarValue,
        },
        {
          avatarValue: mockNetwork2.avatarValue,
        },
      ];

      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup
          type={MultichainAvatarGroupType.NETWORK}
          members={networksWithoutSymbol}
        />,
        store,
      );

      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toThrow();
    });

    it('handles large number of network members with limit', () => {
      const manyNetworks = [
        mockNetwork1,
        mockNetwork2,
        mockNetwork3,
        mockNetwork4,
        mockNetwork5,
      ];

      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup
          type={MultichainAvatarGroupType.NETWORK}
          members={manyNetworks}
          limit={4}
        />,
        store,
      );

      // Should render only 4 network avatars due to limit
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(3))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(4))).toThrow();
    });

    it('handles many network members with generated data', () => {
      const manyNetworks = Array.from({ length: 10 }, (_, index) => ({
        avatarValue: `https://example.com/network-${index}-icon.png`,
        symbol: `Network${index}`,
      }));

      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup
          type={MultichainAvatarGroupType.NETWORK}
          members={manyNetworks}
          limit={4}
        />,
        store,
      );

      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(3))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(4))).toThrow();
    });

    it('respects default limit of 4 when network members exceed limit', () => {
      const manyNetworks = [
        mockNetwork1,
        mockNetwork2,
        mockNetwork3,
        mockNetwork4,
        mockNetwork5,
      ];

      const { getByTestId } = renderWithProvider(
        <MultichainAvatarGroup
          type={MultichainAvatarGroupType.NETWORK}
          members={manyNetworks}
        />,
        store,
      );

      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(0))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(1))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(2))).toBeInTheDocument();
      expect(getByTestId(TEST_IDS.NETWORK_AVATAR(3))).toBeInTheDocument();
      expect(() => getByTestId(TEST_IDS.NETWORK_AVATAR(4))).toThrow();
    });

    it('displays count tag when network members exceed limit', () => {
      const manyNetworks = [
        mockNetwork1,
        mockNetwork2,
        mockNetwork3,
        mockNetwork4,
        mockNetwork5,
      ];

      const { getByText } = renderWithProvider(
        <MultichainAvatarGroup
          type={MultichainAvatarGroupType.NETWORK}
          members={manyNetworks}
          limit={3}
        />,
        store,
      );

      expect(getByText('+2')).toBeInTheDocument();
    });

    it('does not display count tag when network members do not exceed limit', () => {
      const { queryByText } = renderWithProvider(
        <MultichainAvatarGroup {...defaultNetworkProps} limit={5} />,
        store,
      );

      expect(queryByText(/^\+/u)).not.toBeInTheDocument();
    });
  });
});
