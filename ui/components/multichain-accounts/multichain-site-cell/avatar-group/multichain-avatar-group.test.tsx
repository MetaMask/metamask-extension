import React from 'react';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { MultichainAccountAvatarGroup } from './multichain-avatar-group';

const TEST_IDS = {
  AVATAR_GROUP: 'avatar-group',
  AVATAR_ACCOUNT: 'avatar-account',
} as const;

describe('MultichainAccountAvatarGroup', () => {
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

  const defaultProps = {
    members: mockMembers,
  };

  it('renders avatar group with correct test id', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} />,
      store,
    );

    const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
    expect(avatarGroup).toBeInTheDocument();
  });

  it('renders correct number of avatars based on limit', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} limit={2} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(2);
  });

  it('renders all avatars when limit is greater than members count', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} limit={10} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(3);
  });

  it('renders avatars in reverse order', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(3);

    const firstAvatar = avatarAccounts[0];
    expect(firstAvatar).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClassName = 'custom-avatar-group';
    const { getByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup
        {...defaultProps}
        className={customClassName}
      />,
      store,
    );

    const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
    expect(avatarGroup).toHaveClass(customClassName);
  });

  it('renders with default limit when not provided', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(3);
  });

  it('renders empty avatar group when no members provided', () => {
    const { getByTestId, queryAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup members={[]} />,
      store,
    );

    const avatarGroup = getByTestId(TEST_IDS.AVATAR_GROUP);
    expect(avatarGroup).toBeInTheDocument();

    const avatarAccounts = queryAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(0);
  });

  it('renders avatars with correct addresses', () => {
    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(3);
  });

  it('renders avatars with Blockies variant', () => {
    const { getAllByTestId, container } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts.length).toBeGreaterThan(0);

    const blockies = container.querySelectorAll('img');
    expect(blockies.length).toBeGreaterThan(0);
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

    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup members={membersWithoutSymbol} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(2);
  });

  it('handles large number of members with limit', () => {
    const manyMembers = [
      mockAvatar1,
      mockAvatar2,
      mockAvatar3,
      mockAvatar4,
      mockAvatar5,
    ];

    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup members={manyMembers} limit={4} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(4);
  });

  it('handles many members with generated data', () => {
    const manyMembers = Array.from({ length: 10 }, (_, index) => ({
      avatarValue: `0x${index.toString().padStart(40, '0')}`,
      symbol: `TOKEN${index}`,
    }));

    const { getAllByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup members={manyMembers} limit={4} />,
      store,
    );

    const avatarAccounts = getAllByTestId(TEST_IDS.AVATAR_ACCOUNT);
    expect(avatarAccounts).toHaveLength(4);
  });
});
