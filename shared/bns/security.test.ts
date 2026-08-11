import {
  buildTrustedIpfsGatewayUrl,
  hasOnlyValidDnsLabels,
  isAllowedBnesHost,
  isAllowedGatewayUrl,
  isValidCid,
  normalizeBnesName,
} from './security';

describe('shared/bns security helpers', () => {
  it('accepts only unambiguous .bnes hosts with strict DNS labels', () => {
    expect(isAllowedBnesHost('bear.bnes')).toBe(true);
    expect(isAllowedBnesHost('sub.bear.bnes')).toBe(true);
    expect(isAllowedBnesHost('bnes')).toBe(false);
    expect(isAllowedBnesHost('.bnes')).toBe(false);
    expect(isAllowedBnesHost('-bear.bnes')).toBe(false);
    expect(isAllowedBnesHost('bear-.bnes')).toBe(false);
    expect(isAllowedBnesHost('bear..bnes')).toBe(false);
    expect(hasOnlyValidDnsLabels('')).toBe(false);
  });

  it('normalizes bnes:// and bare names, rejecting credentials and ports', () => {
    expect(normalizeBnesName('BEAR.BNES')).toBe('bear.bnes');
    expect(normalizeBnesName('bnes://bear.bnes/index.html')).toBe('bear.bnes');
    expect(normalizeBnesName('bnes://user@bear.bnes/')).toBeNull();
    expect(normalizeBnesName('bnes://bear.bnes:443/')).toBeNull();
    expect(normalizeBnesName('https://evil.test/')).toBeNull();
  });

  it('restricts CID text to CIDv0 base58 and CIDv1 lowercase base32', () => {
    expect(
      isValidCid('QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF'),
    ).toBe(true);
    expect(isValidCid('bafybeigdyrzt5bjby2q5y3s3v3v3v3v3v3v3v3v3v3v')).toBe(
      true,
    );
    expect(isValidCid('Bafybeigdyrzt')).toBe(false);
    expect(isValidCid('bafybeigdyrz0')).toBe(false);
    expect(isValidCid('bafy/beigdyrzt')).toBe(false);
    expect(isValidCid('bafybeigdyrzt?redirect=local')).toBe(false);
  });

  it('builds path gateway URLs only for trusted host + validated CID', () => {
    const url = buildTrustedIpfsGatewayUrl(
      'ipfs.bearnetwork.net',
      'QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF',
      'index.html',
    );
    expect(url).toBe(
      'https://ipfs.bearnetwork.net/ipfs/QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF/index.html',
    );
    expect(() =>
      buildTrustedIpfsGatewayUrl('ipfs.bearnetwork.net', 'bafy/evil'),
    ).toThrow('CID failed structural validation');
  });

  it('pins gateway URLs to the trusted HTTPS origin', () => {
    expect(
      isAllowedGatewayUrl(
        'https://ipfs.bearnetwork.net/ipfs/bafybeigdyrzt',
        'ipfs.bearnetwork.net',
      ),
    ).toBe(true);
    expect(
      isAllowedGatewayUrl(
        'http://ipfs.bearnetwork.net/ipfs/bafybeigdyrzt',
        'ipfs.bearnetwork.net',
      ),
    ).toBe(false);
    expect(
      isAllowedGatewayUrl(
        'https://ipfs.bearnetwork.net.evil.test/ipfs/bafybeigdyrzt',
        'ipfs.bearnetwork.net',
      ),
    ).toBe(false);
  });
});
