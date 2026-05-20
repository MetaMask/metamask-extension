import type {
  ActivityListItem,
  TokenAmount,
} from '../../../shared/lib/activity/types';
import { getActivityListItemAvatarConfig } from './resolve-activity-avatar-config';

const context = {
  chainIdForImage: 'eip155:1' as const,
  hexChainId: '0x1',
  networkName: 'Ethereum',
};

describe('getActivityListItemAvatarConfig', () => {
  it('returns dual config for cross-token swap', () => {
    const sourceToken: TokenAmount = { direction: 'out', symbol: 'ETH' };
    const destinationToken: TokenAmount = { direction: 'in', symbol: 'USDC' };
    const activity: ActivityListItem = {
      type: 'swap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: { sourceToken, destinationToken },
    };

    const config = getActivityListItemAvatarConfig(
      activity,
      destinationToken,
      sourceToken,
      context,
    );

    expect(config.variant).toBe('dual');
    if (config.variant === 'dual') {
      expect(config.from.symbol).toBe('ETH');
      expect(config.to.symbol).toBe('USDC');
    }
  });

  it('returns single config for send', () => {
    const token: TokenAmount = { direction: 'out', symbol: 'ETH' };
    const activity: ActivityListItem = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1',
        to: '0x2',
        token,
      },
    };

    const config = getActivityListItemAvatarConfig(
      activity,
      token,
      undefined,
      context,
    );

    expect(config.variant).toBe('single');
    if (config.variant === 'single') {
      expect(config.token.imageUrl).toBeDefined();
    }
  });

  it('returns native token image when send has no symbol', () => {
    const activity: ActivityListItem = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x1',
        to: '0x2',
      },
    };

    const config = getActivityListItemAvatarConfig(
      activity,
      undefined,
      undefined,
      context,
    );

    expect(config.variant).toBe('single');
    if (config.variant === 'single') {
      expect(config.token.symbol).toBe('ETH');
      expect(config.token.imageUrl).toContain('tokenIcons');
    }
  });

  it('returns ERC-20 token image when asset id is provided', () => {
    const token: TokenAmount = {
      direction: 'out',
      symbol: 'USDC',
      assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    };
    const activity: ActivityListItem = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: { from: '0x1', to: '0x2', token },
    };

    const config = getActivityListItemAvatarConfig(
      activity,
      token,
      undefined,
      context,
    );

    expect(config.variant).toBe('single');
    if (config.variant === 'single') {
      expect(config.token.imageUrl).toContain(
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      );
    }
  });

  it('returns dual config with image URLs for cross-token swap with asset ids', () => {
    const sourceToken: TokenAmount = {
      direction: 'out',
      symbol: 'USDC',
      assetId: 'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    };
    const destinationToken: TokenAmount = {
      direction: 'in',
      symbol: 'DAI',
      assetId: 'eip155:8453/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
    };
    const activity: ActivityListItem = {
      type: 'swap',
      chainId: 'eip155:8453',
      status: 'success',
      timestamp: 1,
      data: { sourceToken, destinationToken },
    };

    const config = getActivityListItemAvatarConfig(
      activity,
      destinationToken,
      sourceToken,
      {
        chainIdForImage: 'eip155:8453',
        hexChainId: '0x2105',
        networkName: 'Base',
      },
    );

    expect(config.variant).toBe('dual');
    if (config.variant === 'dual') {
      expect(config.from.imageUrl).toContain(
        '833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      );
      expect(config.to.imageUrl).toContain(
        '6b175474e89094c44da98b954eedeac495271d0f',
      );
    }
  });

  it('returns token image URL from keyring CAIP asset id on non-EVM send', () => {
    const token: TokenAmount = {
      direction: 'out',
      symbol: 'USDC',
      assetId:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    };
    const activity: ActivityListItem = {
      type: 'send',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      status: 'success',
      timestamp: 1,
      data: { from: 'from', to: 'to', token },
    };

    const config = getActivityListItemAvatarConfig(activity, token, undefined, {
      chainIdForImage: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      hexChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      networkName: 'Solana',
    });

    expect(config.variant).toBe('single');
    if (config.variant === 'single') {
      expect(config.token.imageUrl).toContain('tokenIcons');
      expect(config.token.imageUrl).toContain(
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      );
    }
  });

  it('returns single config for same-token swap', () => {
    const sourceToken: TokenAmount = { direction: 'out', symbol: 'USDC' };
    const destinationToken: TokenAmount = { direction: 'in', symbol: 'USDC' };
    const activity: ActivityListItem = {
      type: 'swap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: { sourceToken, destinationToken },
    };

    const config = getActivityListItemAvatarConfig(
      activity,
      destinationToken,
      sourceToken,
      context,
    );

    expect(config.variant).toBe('single');
  });
});
