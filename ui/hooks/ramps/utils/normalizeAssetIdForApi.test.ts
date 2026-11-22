import { normalizeAssetIdForApi } from './normalizeAssetIdForApi';

describe('normalizeAssetIdForApi', () => {
  it('matches snapshot for asset id inputs', () => {
    expect({
      undefined: normalizeAssetIdForApi(undefined),
      empty: normalizeAssetIdForApi(''),
      eip155: normalizeAssetIdForApi('EIP155:1/ERC20:0xABC'),
      other: normalizeAssetIdForApi('solana:5eykt.../token:ABC'),
    }).toMatchSnapshot();
  });
});
