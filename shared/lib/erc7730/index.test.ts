import { getErc7730Intent, getErc7730Owner } from '.';

describe('getErc7730Intent', () => {
  describe('Uniswap V3 SwapRouter02 (mainnet)', () => {
    const ROUTER = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45';

    it('recognises exactInputSingle', () => {
      expect(getErc7730Intent(1, ROUTER, '0x414bf389deadbeef')).toBe(
        'Swap on Uniswap',
      );
    });

    it('recognises exactInput', () => {
      expect(getErc7730Intent(1, ROUTER, '0xc04b8d59cafebabe')).toBe(
        'Swap on Uniswap',
      );
    });

    it('accepts a hex-string chainId', () => {
      expect(getErc7730Intent('0x1', ROUTER, '0x414bf389')).toBe(
        'Swap on Uniswap',
      );
    });

    it('matches both lower-case and checksum address forms', () => {
      expect(getErc7730Intent(1, ROUTER.toLowerCase(), '0x414bf389')).toBe(
        'Swap on Uniswap',
      );
      expect(getErc7730Intent(1, ROUTER, '0x414bf389')).toBe(
        'Swap on Uniswap',
      );
    });

    it('matches selectors regardless of calldata casing', () => {
      expect(getErc7730Intent(1, ROUTER, '0x414BF389')).toBe(
        'Swap on Uniswap',
      );
    });
  });

  describe('WETH9 (mainnet)', () => {
    const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

    it('recognises deposit() as Wrap ETH', () => {
      expect(getErc7730Intent(1, WETH, '0xd0e30db0')).toBe('Wrap ETH');
    });

    it('recognises withdraw(uint256) as Unwrap ETH', () => {
      expect(
        getErc7730Intent(
          1,
          WETH,
          '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ),
      ).toBe('Unwrap ETH');
    });
  });

  describe('Seaport (OpenSea)', () => {
    const SEAPORT_16 = '0x0000000000000068F116a894984e2DB1123eB395';
    const SEAPORT_15 = '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC';

    it.each([
      ['0xfb0f3ee1', 'fulfillBasicOrder'],
      ['0x00000000', 'fulfillBasicOrder_efficient_6GL6yc'],
      ['0xb3a34c4c', 'fulfillOrder'],
      ['0xe7acab24', 'fulfillAdvancedOrder'],
    ])('Seaport 1.6: %s (%s) -> Buy NFT on OpenSea', (selector) => {
      expect(getErc7730Intent(1, SEAPORT_16, selector)).toBe(
        'Buy NFT on OpenSea',
      );
    });

    it.each([
      ['0x87201b41', 'fulfillAvailableAdvancedOrders'],
      ['0xed98a574', 'fulfillAvailableOrders'],
    ])('Seaport 1.6: %s (%s) -> Buy NFTs on OpenSea', (selector) => {
      expect(getErc7730Intent(1, SEAPORT_16, selector)).toBe(
        'Buy NFTs on OpenSea',
      );
    });

    it('Seaport 1.5 still matches fulfillAdvancedOrder', () => {
      expect(getErc7730Intent(1, SEAPORT_15, '0xe7acab24')).toBe(
        'Buy NFT on OpenSea',
      );
    });
  });

  describe('Local Anvil PiggyBank demo entry', () => {
    const PIGGY = '0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947';

    it('recognises deposit() on chain 1337', () => {
      expect(getErc7730Intent(1337, PIGGY, '0xd0e30db0')).toBe(
        'Deposit to Piggy Bank',
      );
    });

    it('recognises withdraw() on chain 1337', () => {
      expect(getErc7730Intent(1337, PIGGY, '0x2e1a7d4d')).toBe(
        'Withdraw from Piggy Bank',
      );
    });

    it('does not match the same address on mainnet', () => {
      expect(getErc7730Intent(1, PIGGY, '0xd0e30db0')).toBeUndefined();
    });
  });

  describe('non-matches', () => {
    it('returns undefined for an unknown contract', () => {
      expect(
        getErc7730Intent(
          1,
          '0x1111111111111111111111111111111111111111',
          '0x414bf389',
        ),
      ).toBeUndefined();
    });

    it('returns undefined for an unknown selector on a known contract', () => {
      expect(
        getErc7730Intent(
          1,
          '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
          '0xdeadbeef',
        ),
      ).toBeUndefined();
    });

    it('returns undefined when chainId is missing', () => {
      expect(
        getErc7730Intent(
          undefined,
          '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
          '0x414bf389',
        ),
      ).toBeUndefined();
    });

    it('returns undefined when to is malformed', () => {
      expect(getErc7730Intent(1, '0xnotanaddress', '0x414bf389')).toBeUndefined();
    });

    it('returns undefined when data is shorter than a 4-byte selector', () => {
      expect(
        getErc7730Intent(
          1,
          '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
          '0x4141',
        ),
      ).toBeUndefined();
    });

    it('returns undefined when data is empty', () => {
      expect(
        getErc7730Intent(
          1,
          '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
          '',
        ),
      ).toBeUndefined();
    });
  });
});

describe('getErc7730Owner', () => {
  it('returns the owner string for a known contract', () => {
    expect(
      getErc7730Owner(1, '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
    ).toBe('Uniswap');
  });

  it('returns undefined for an unknown contract', () => {
    expect(
      getErc7730Owner(1, '0x1111111111111111111111111111111111111111'),
    ).toBeUndefined();
  });
});
