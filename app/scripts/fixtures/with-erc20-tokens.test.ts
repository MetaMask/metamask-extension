import { buildFixtureErc20AssetsState } from './with-erc20-tokens';

describe('buildFixtureErc20AssetsState', () => {
  it('seeds the benchmark ERC-20 catalog as AssetsController custom assets', () => {
    const state = buildFixtureErc20AssetsState('account-id-0');
    const daiAssetId =
      'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f';
    const assetIds = state.customAssets['account-id-0'];

    expect(assetIds).toContain(daiAssetId);
    expect(assetIds.some((assetId) => assetId.startsWith('eip155:10/'))).toBe(
      true,
    );
    expect(state.assetsInfo[daiAssetId]).toMatchObject({
      type: 'erc20',
      symbol: 'DAI',
      name: 'DAI',
      decimals: 18,
      image:
        'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6B175474E89094C44Da98b954EedeAC495271d0F.png',
    });
  });

  it('copies the catalog so callers can mutate the result', () => {
    const first = buildFixtureErc20AssetsState('account-id-0');
    first.customAssets['account-id-0'].push('mutated');

    const second = buildFixtureErc20AssetsState('account-id-0');

    expect(second.customAssets['account-id-0']).not.toContain('mutated');
  });
});
