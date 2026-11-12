/**
 * Positive control for image-decoding experiments: puts several tokens with
 * remote icons into the fixture and serves each icon as a 4096x4096 PNG, the
 * size of the oversized icons that production once served.
 *
 * Enabled by BENCHMARK_BIG_ICONS=1; the default benchmark fixture has no
 * remote icons at all.
 */

import type { Mockttp } from 'mockttp';
import sharp from 'sharp';
import type FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../constants';
import { MOCK_PRIORITIES } from '../mocks/performance-mocks';

const BIG_ICON_SIZE = 4096;
const BIG_ICON_TOKEN_COUNT = 5;
const BIG_ICON_CHAIN_ID = 1337;

export function isBigIconArmEnabled(): boolean {
  return process.env.BENCHMARK_BIG_ICONS === '1';
}

function tokenAddress(index: number): string {
  return `0x${(index + 1).toString(16).padStart(40, '0')}`;
}

export function withBigIconTokens(builder: FixtureBuilderV2): FixtureBuilderV2 {
  const customAssets: string[] = [];
  const assetsBalance: Record<string, { amount: string }> = {};
  const assetsInfo: Record<string, unknown> = {};
  for (let i = 0; i < BIG_ICON_TOKEN_COUNT; i += 1) {
    const address = tokenAddress(i);
    const assetId = `eip155:${BIG_ICON_CHAIN_ID}/erc20:${address}`;
    customAssets.push(assetId);
    assetsBalance[assetId] = { amount: '10' };
    assetsInfo[assetId] = {
      aggregators: ['Metamask'],
      decimals: 4,
      image: `https://static.cx.metamask.io/api/v1/tokenIcons/${BIG_ICON_CHAIN_ID}/${address}.png`,
      name: `BigIcon ${i}`,
      symbol: `BIG${i}`,
      type: 'erc20',
    };
  }
  return builder.withAssetsController({
    customAssets: { [DEFAULT_FIXTURE_ACCOUNT_ID]: customAssets },
    assetsBalance: { [DEFAULT_FIXTURE_ACCOUNT_ID]: assetsBalance },
    assetsInfo,
  } as Parameters<FixtureBuilderV2['withAssetsController']>[0]);
}

let bigIconPng: Promise<Buffer> | undefined;

function getBigIconPng(): Promise<Buffer> {
  bigIconPng ??= sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${BIG_ICON_SIZE}" height="${BIG_ICON_SIZE}"><defs><radialGradient id="g"><stop offset="0" stop-color="orange"/><stop offset="1" stop-color="brown"/></radialGradient></defs><rect width="100%" height="100%" fill="white"/><circle cx="50%" cy="50%" r="48%" fill="url(#g)"/></svg>`,
    ),
  )
    .png()
    .toBuffer();
  return bigIconPng;
}

export async function mockBigTokenIcons(server: Mockttp): Promise<void> {
  const png = await getBigIconPng();
  await server
    .forGet(/^https:\/\/static\.cx\.metamask\.io\/api\/v\d+\/tokenIcons\//u)
    .asPriority(MOCK_PRIORITIES.HIGH_PRIORITY)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      headers: { 'content-type': 'image/png' },
      rawBody: png,
    }));
}
