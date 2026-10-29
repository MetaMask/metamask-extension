import {
  ALL_METAMASK_FACILITATOR_ADDRESSES,
  isMetaMaskFacilitatorAddress,
} from './facilitator-addresses';

describe('isMetaMaskFacilitatorAddress', () => {
  it('matches facilitator addresses case-insensitively', () => {
    expect(
      isMetaMaskFacilitatorAddress(
        ALL_METAMASK_FACILITATOR_ADDRESSES[0].toLowerCase(),
      ),
    ).toBe(true);
    expect(
      isMetaMaskFacilitatorAddress(
        ALL_METAMASK_FACILITATOR_ADDRESSES[0].toUpperCase(),
      ),
    ).toBe(true);
  });

  it('returns false for unknown addresses', () => {
    expect(
      isMetaMaskFacilitatorAddress(
        '0x0000000000000000000000000000000000000001',
      ),
    ).toBe(false);
  });
});
