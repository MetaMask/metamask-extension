import { decodeIpfsContenthash } from './contenthash';

describe('shared/bns contenthash', () => {
  it('decodes a known CIDv0 ENS IPFS contenthash', () => {
    // 0xe3 || sha2-256 multihash of the classic empty-dir QmYwAPJ… CID
    const contenthash =
      '0xe312209d6c2be50f70695347c6da90ab413d0fdd87c8f85b09b78d26718f61c3c7a70e';
    expect(decodeIpfsContenthash(contenthash)).toBe(
      'QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF',
    );
  });

  it('rejects non-IPFS or empty payloads', () => {
    expect(decodeIpfsContenthash('0xe4')).toBeNull();
    expect(decodeIpfsContenthash('0x')).toBeNull();
    expect(decodeIpfsContenthash('not-hex')).toBeNull();
  });
});
