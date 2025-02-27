import {
  formatBlockExplorerUrl,
  formatBlockExplorerAddressUrl,
  MultichainBlockExplorerFormatUrls,
} from './networks';

describe('multichain - networks', () => {
  it('formats a URL', () => {
    const value = 'something-else';

    expect(
      formatBlockExplorerUrl(
        'https://foo.bar/show/{foobar}/1',
        '{foobar}',
        value,
      ),
    ).toBe(`https://foo.bar/show/${value}/1`);
  });

  it('formats a URL for an address', () => {
    const address = 'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k';
    const urls: MultichainBlockExplorerFormatUrls = {
      url: 'https://foo.bar',
      address: 'https://foo.bar/address/{address}?detail=true',
      transaction: 'https://foo.bar/tx/{txId}?detail=true',
    };

    expect(formatBlockExplorerAddressUrl(urls, address)).toBe(
      `https://foo.bar/address/${address}?detail=true`,
    );
  });
});
