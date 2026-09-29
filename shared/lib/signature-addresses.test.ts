import { MAX_SIGNATURE_ADDRESSES_CEILING } from '@metamask/phishing-controller';
import { getSignatureAddressExtractionOptions } from './signature-addresses';

describe('getSignatureAddressExtractionOptions', () => {
  it('excludes permit spender from the generic window regardless of domain fields', () => {
    const options = getSignatureAddressExtractionOptions(
      { primaryType: 'Permit' },
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );

    expect(options).toStrictEqual({
      exclude: ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
      excludeFields: ['spender'],
      maxAddresses: MAX_SIGNATURE_ADDRESSES_CEILING,
    });
  });

  it('keeps non-permit address fields in the generic window', () => {
    expect(
      getSignatureAddressExtractionOptions({ primaryType: 'Transfer' }),
    ).toStrictEqual({
      exclude: [],
      excludeFields: [],
      maxAddresses: MAX_SIGNATURE_ADDRESSES_CEILING,
    });
  });
});
