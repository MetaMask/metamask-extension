import { normalizeAssetIdForComparison } from './normalizeAssetIdForComparison';

describe('normalizeAssetIdForComparison', () => {
  it('matches snapshot for asset id inputs', () => {
    expect({
      undefined: normalizeAssetIdForComparison(undefined),
      empty: normalizeAssetIdForComparison(''),
      eip155: normalizeAssetIdForComparison('EIP155:1/ERC20:0xABC'),
      other: normalizeAssetIdForComparison('solana:5eykt.../token:ABC'),
    }).toMatchSnapshot();
  });
});
