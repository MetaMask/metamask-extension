import { convertAddressToAssetCaipType } from './asset-chart';

describe('convertAddressToAssetCaipType', () => {
  it('returns address unchanged when already a CAIP asset type', () => {
    const address = 'eip155:1/erc20:0x6982508145454Ce325dDbE47a25d4ec3d2311933';
    const chainId = '0x1';

    const result = convertAddressToAssetCaipType(address, chainId);

    expect(result).toBe(address);
  });

  it('creates EIP155 CAIP asset type for valid hex address and chainId', () => {
    const address = '0x6982508145454Ce325dDbE47a25d4ec3d2311933';
    const chainId = '0x1';

    const result = convertAddressToAssetCaipType(address, chainId);

    expect(result).toBe(
      'eip155:1/erc20:0x6982508145454Ce325dDbE47a25d4ec3d2311933',
    );
  });

  it('returns undefined for invalid inputs', () => {
    const inputs = [
      { address: 'not-a-hex-string', chainId: '0x1' },
      {
        address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        chainId: 'not-a-hex-string',
      },
      { address: 'not-a-hex-string', chainId: 'not-a-hex-string' },
    ];
    inputs.forEach(({ address, chainId }) => {
      const result = convertAddressToAssetCaipType(address, chainId);
      expect(result).toBeUndefined();
    });
  });
});
