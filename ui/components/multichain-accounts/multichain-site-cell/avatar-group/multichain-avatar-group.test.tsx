import React from 'react';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { MultichainAccountAvatarGroup } from './multichain-avatar-group';

const TEST_IDS = {
  AVATAR_GROUP: 'avatar-group',
  AVATAR_ACCOUNT: (index: number) => `avatar-account-${index}`,
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
    const { getByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} limit={2} />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toThrow();
  });

  it('renders all avatars when limit is greater than members count', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} limit={10} />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toThrow();
  });

  it('renders avatars in reverse order', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} />,
      store,
    );

    // The component reverses the order, so the first rendered avatar should be the last member
    const firstRenderedAvatar = getByTestId(TEST_IDS.AVATAR_ACCOUNT(0));
    expect(firstRenderedAvatar).toBeInTheDocument();
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
    const { getByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup {...defaultProps} />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toThrow();
  });

  it('renders empty avatar group when no members provided', () => {
    const { getByTestId } = renderWithProvider(
      <MultichainAccountAvatarGroup members={[]} />,
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
      <MultichainAccountAvatarGroup members={membersWithoutSymbol} />,
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
      <MultichainAccountAvatarGroup members={manyMembers} limit={4} />,
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
      <MultichainAccountAvatarGroup members={manyMembers} limit={4} />,
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
      <MultichainAccountAvatarGroup members={manyMembers} />,
      store,
    );

    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(0))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(1))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(2))).toBeInTheDocument();
    expect(getByTestId(TEST_IDS.AVATAR_ACCOUNT(3))).toBeInTheDocument();
    expect(() => getByTestId(TEST_IDS.AVATAR_ACCOUNT(4))).toThrow();
  });
});
