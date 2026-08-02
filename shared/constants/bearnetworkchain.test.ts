/**
 * BearNetworkChain customization tests.
 * Kept separate from network.test.ts to reduce upstream merge conflicts.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { RpcEndpointType } from '@metamask/network-controller';
import {
  BEAR_NETWORK_CHAIN_BLOCK_EXPLORER_URL,
  BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL,
  BEAR_NETWORK_CHAIN_DISPLAY_NAME,
  BEAR_NETWORK_CHAIN_FAILOVER_URLS,
  BEAR_NETWORK_CHAIN_FEATURED,
  BEAR_NETWORK_CHAIN_ID,
  BEAR_NETWORK_CHAIN_IMAGE_URL,
  BEAR_NETWORK_CHAIN_RPC_URL,
} from './bearnetworkchain';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
  FEATURED_RPCS,
  NETWORK_TO_NAME_MAP,
} from './network';

describe('BearNetworkChain customization', () => {
  it('uses chain id 0x9c8ce (641230)', () => {
    expect(BEAR_NETWORK_CHAIN_ID).toBe('0x9c8ce');
    expect(parseInt(BEAR_NETWORK_CHAIN_ID, 16)).toBe(641230);
    expect(CHAIN_IDS.BEAR_NETWORK_CHAIN).toBe(BEAR_NETWORK_CHAIN_ID);
  });

  it('maps display name and logo via network constants', () => {
    expect(NETWORK_TO_NAME_MAP[CHAIN_IDS.BEAR_NETWORK_CHAIN]).toBe(
      BEAR_NETWORK_CHAIN_DISPLAY_NAME,
    );
    expect(CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[CHAIN_IDS.BEAR_NETWORK_CHAIN]).toBe(
      BEAR_NETWORK_CHAIN_IMAGE_URL,
    );
    expect(CHAIN_ID_TOKEN_IMAGE_MAP[CHAIN_IDS.BEAR_NETWORK_CHAIN]).toBe(
      BEAR_NETWORK_CHAIN_IMAGE_URL,
    );
    expect(existsSync(join('app', BEAR_NETWORK_CHAIN_IMAGE_URL))).toBe(true);
  });

  it('is the first FEATURED_RPCS entry with official failoverUrls', () => {
    expect(FEATURED_RPCS[0]).toBe(BEAR_NETWORK_CHAIN_FEATURED);
    expect(BEAR_NETWORK_CHAIN_FEATURED).toMatchObject({
      chainId: BEAR_NETWORK_CHAIN_ID,
      name: BEAR_NETWORK_CHAIN_DISPLAY_NAME,
      nativeCurrency: BEAR_NETWORK_CHAIN_CURRENCY_SYMBOL,
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: [BEAR_NETWORK_CHAIN_BLOCK_EXPLORER_URL],
      defaultBlockExplorerUrlIndex: 0,
    });

    const [primaryEndpoint] = BEAR_NETWORK_CHAIN_FEATURED.rpcEndpoints;
    expect(primaryEndpoint).toMatchObject({
      url: BEAR_NETWORK_CHAIN_RPC_URL,
      type: RpcEndpointType.Custom,
      failoverUrls: [...BEAR_NETWORK_CHAIN_FAILOVER_URLS],
    });
    expect(primaryEndpoint.failoverUrls).toStrictEqual([
      'https://brnkc-mainnet1.bearnetwork.net',
      'https://bnes-mainnet.bearnetwork.net',
      'https://bnes-mainnet1.bearnetwork.net',
    ]);
  });
});
