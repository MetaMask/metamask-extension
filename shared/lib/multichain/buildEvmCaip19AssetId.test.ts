import { CHAIN_IDS } from '@metamask/transaction-controller';
import { buildEvmCaip19AssetId } from './buildEvmCaip19AssetId';

const ADDRESS_MOCK = '0x0439e60f02a8900a951603950d8d4527f400c3f1';

describe('buildEvmCaip19AssetId', () => {
  it('builds a CAIP-19 asset ID for Mainnet', () => {
    expect(buildEvmCaip19AssetId(ADDRESS_MOCK, CHAIN_IDS.MAINNET)).toBe(
      `eip155:1/erc20:${ADDRESS_MOCK}`,
    );
  });

  it('builds a CAIP-19 asset ID for a non-Mainnet chain', () => {
    expect(buildEvmCaip19AssetId(ADDRESS_MOCK, CHAIN_IDS.POLYGON)).toBe(
      `eip155:137/erc20:${ADDRESS_MOCK}`,
    );
  });

  it('normalizes the address to lowercase', () => {
    expect(
      buildEvmCaip19AssetId(ADDRESS_MOCK.toUpperCase(), CHAIN_IDS.MAINNET),
    ).toBe(`eip155:1/erc20:${ADDRESS_MOCK}`);
  });
});
