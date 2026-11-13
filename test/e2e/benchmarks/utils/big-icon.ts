/**
 * Icon arms for image-decoding experiments. The default benchmark fixture has
 * no remote icons at all. BENCHMARK_ICON_ARM selects:
 *
 * - `pain`: one Ethereum mainnet token whose icon is the real, oversized PAIN
 *   icon (1000x1000, 1.9 MB). The bytes are fetched once from the live CDN.
 * - `big1`: one mainnet token whose icon is a 4096x4096 PNG, like the
 *   4091 px Bitcoin icon that started this investigation.
 * - `synthetic`: five mainnet tokens whose icons are 4096x4096 PNGs.
 *
 * The mock answers with the real CDN's caching headers (ETag and
 * Last-Modified, no Cache-Control), so Chrome caches the icon the way it
 * caches the real file: every browser session starts with an empty cache and
 * fetches the bytes (load 1 is cold), and later page loads in the session are
 * warm. That matters because an icon whose bytes are already available when
 * React commits is decoded inside the first content frame, which is what
 * decoding="async" is meant to avoid.
 *
 * The home list only shows enabled-network assets, which is Ethereum mainnet.
 */

import { createHash } from 'crypto';
import type { Mockttp } from 'mockttp';
import sharp from 'sharp';
import type FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../constants';
import { MOCK_PRIORITIES } from '../mocks/performance-mocks';

export type IconArm = 'pain' | 'big1' | 'synthetic';

const PAIN_ICON_URL =
  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/1Qf8gESP4i6CFNWerUSDdLKJ9U1LpqTYvjJ2MM4pain.png';
const SYNTHETIC_ICON_SIZE = 4096;
const TOKEN_COUNT: Record<IconArm, number> = {
  pain: 1,
  big1: 1,
  synthetic: 5,
};
const ICON_BASE = 'https://static.cx.metamask.io/api/v2/tokenIcons/assets';

export function getIconArm(): IconArm | undefined {
  const arm = process.env.BENCHMARK_ICON_ARM;
  if (arm === 'pain' || arm === 'big1' || arm === 'synthetic') {
    return arm;
  }
  return undefined;
}

function tokenAddress(index: number): string {
  return `0x${(index + 1).toString(16).padStart(40, '0')}`;
}

function iconUrl(index: number): string {
  return `${ICON_BASE}/eip155/1/erc20/${tokenAddress(index)}.png`;
}

/** Accounts API rows that give the fixture account a balance of each icon token. */
export function getIconTokenBalances(arm: IconArm) {
  return Array.from({ length: TOKEN_COUNT[arm] }, (_, i) => ({
    assetId: `eip155:1/erc20:${tokenAddress(i)}`,
    balance: '10',
  }));
}

export function withIconTokens(
  builder: FixtureBuilderV2,
  arm: IconArm,
): FixtureBuilderV2 {
  const customAssets: string[] = [];
  const assetsBalance: Record<string, { amount: string }> = {};
  const assetsInfo: Record<string, unknown> = {};
  for (let i = 0; i < TOKEN_COUNT[arm]; i += 1) {
    const assetId = `eip155:1/erc20:${tokenAddress(i)}`;
    customAssets.push(assetId);
    assetsBalance[assetId] = { amount: '10' };
    assetsInfo[assetId] = {
      aggregators: ['Metamask'],
      decimals: 4,
      image: iconUrl(i),
      name: `Icon ${i}`,
      symbol: `ICO${i}`,
      type: 'erc20',
    };
  }
  return builder
    .withEnabledNetworks({ eip155: { '0x1': true } })
    .withAssetsController({
      customAssets: { [DEFAULT_FIXTURE_ACCOUNT_ID]: customAssets },
      assetsBalance: { [DEFAULT_FIXTURE_ACCOUNT_ID]: assetsBalance },
      assetsInfo,
    } as Parameters<FixtureBuilderV2['withAssetsController']>[0]);
}

function syntheticPng(): Promise<Buffer> {
  return sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${SYNTHETIC_ICON_SIZE}" height="${SYNTHETIC_ICON_SIZE}"><defs><radialGradient id="g"><stop offset="0" stop-color="orange"/><stop offset="1" stop-color="brown"/></radialGradient></defs><rect width="100%" height="100%" fill="white"/><circle cx="50%" cy="50%" r="48%" fill="url(#g)"/></svg>`,
    ),
  )
    .png()
    .toBuffer();
}

async function painPng(): Promise<Buffer> {
  const response = await fetch(PAIN_ICON_URL);
  if (!response.ok) {
    throw new Error(`PAIN icon fetch failed: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function mockIcons(server: Mockttp, arm: IconArm): Promise<void> {
  const png = await (arm === 'pain' ? painPng() : syntheticPng());
  const lastModified = 'Wed, 07 Jan 2026 00:07:46 GMT';
  const etag = `"${createHash('md5').update(png).digest('hex')}"`;
  await server
    .forGet(
      /^https:\/\/static\.cx\.metamask\.io\/api\/v2\/tokenIcons\/assets\/eip155\/1\/erc20\//u,
    )
    .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      headers: {
        'content-type': 'image/png',
        // Lets the page read transferSize, to tell cache hits from fetches.
        'timing-allow-origin': '*',
        'last-modified': lastModified,
        etag,
      },
      rawBody: png,
    }));
}
