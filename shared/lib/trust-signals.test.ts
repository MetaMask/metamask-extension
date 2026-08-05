import {
  extractSignatureAddresses,
  mapChainIdToSupportedEVMChain,
  SupportedEVMChain,
} from './trust-signals';

const ADDR_A = '0x1111111111111111111111111111111111111111';
const ADDR_B = '0x2222222222222222222222222222222222222222';
const ADDR_C = '0x3333333333333333333333333333333333333333';
const ADDR_D = '0x5555555555555555555555555555555555555555';
const SIGNER = '0x4444444444444444444444444444444444444444';
const ZERO = '0x0000000000000000000000000000000000000000';

const DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const build = (
  primaryType: string,
  types: Record<string, { name: string; type: string }[]>,
  message: Record<string, unknown>,
) => ({
  types: { EIP712Domain: DOMAIN_TYPE, ...types },
  primaryType,
  domain: { verifyingContract: ADDR_C },
  message,
});

const addressesOf = (
  ...args: Parameters<typeof extractSignatureAddresses>
): string[] => extractSignatureAddresses(...args).addresses;

const nAddresses = (count: number): string[] =>
  Array.from(
    { length: count },
    (_, i) => `0x${(i + 1).toString(16).padStart(2, '0').repeat(20)}`,
  );

describe('extractSignatureAddresses', () => {
  it('extracts a permit `spender` from the schema', () => {
    const data = build(
      'Permit',
      {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
        ],
      },
      { owner: SIGNER, spender: ADDR_A, value: '1' },
    );
    expect(addressesOf(data, { exclude: [SIGNER] })).toStrictEqual([ADDR_A]);
  });

  it('extracts an EIP-3009 `to`', () => {
    const data = build(
      'ReceiveWithAuthorization',
      {
        ReceiveWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
        ],
      },
      { from: SIGNER, to: ADDR_A, value: '1' },
    );
    expect(addressesOf(data, { exclude: [SIGNER] })).toStrictEqual([ADDR_A]);
  });

  it('extracts an address field with a protocol-specific name', () => {
    const data = {
      domain: {
        name: 'HyperliquidSignTransaction',
        version: '1',
        chainId: 8453,
        verifyingContract: ZERO,
      },
      message: {
        hyperliquidChain: 'Mainnet',
        signatureChainId: '0x2105',
        agentAddress: ADDR_A,
        agentName: '',
        nonce: 1784737070579,
        type: 'approveAgent',
      },
      primaryType: 'HyperliquidTransaction:ApproveAgent',
      types: {
        EIP712Domain: DOMAIN_TYPE,
        'HyperliquidTransaction:ApproveAgent': [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'agentAddress', type: 'address' },
          { name: 'agentName', type: 'string' },
          { name: 'nonce', type: 'uint64' },
        ],
      },
    };
    expect(addressesOf(data, { exclude: [SIGNER] })).toStrictEqual([ADDR_A]);
  });

  it('extracts EVERY address field in a Seaport order (offerer/zone/token/recipient), nested structs + arrays', () => {
    const data = build(
      'OrderComponents',
      {
        OrderComponents: [
          { name: 'offerer', type: 'address' },
          { name: 'zone', type: 'address' },
          { name: 'offer', type: 'OfferItem[]' },
          { name: 'consideration', type: 'ConsiderationItem[]' },
          { name: 'startTime', type: 'uint256' },
        ],
        OfferItem: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        ConsiderationItem: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'recipient', type: 'address' },
        ],
      },
      {
        offerer: SIGNER,
        zone: ADDR_A,
        offer: [{ token: ADDR_B, amount: '1' }],
        consideration: [{ token: ADDR_C, amount: '1', recipient: ADDR_D }],
        startTime: '0',
      },
    );
    expect(addressesOf(data, { exclude: [SIGNER] })).toStrictEqual([
      ADDR_A,
      ADDR_B,
      ADDR_C,
      ADDR_D,
    ]);
  });

  it('extracts addresses from a Permit2 batch (struct array + top-level spender)', () => {
    const data = build(
      'PermitBatch',
      {
        PermitBatch: [
          { name: 'details', type: 'PermitDetails[]' },
          { name: 'spender', type: 'address' },
          { name: 'sigDeadline', type: 'uint256' },
        ],
        PermitDetails: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint160' },
        ],
      },
      {
        details: [
          { token: ADDR_A, amount: '1' },
          { token: ADDR_B, amount: '2' },
        ],
        spender: ADDR_C,
        sigDeadline: '0',
      },
    );
    expect(addressesOf(data)).toStrictEqual([ADDR_A, ADDR_B, ADDR_C]);
  });

  it('extracts an `address[]` field', () => {
    const data = build(
      'Airdrop',
      { Airdrop: [{ name: 'recipients', type: 'address[]' }] },
      { recipients: [ADDR_A, ADDR_B] },
    );
    expect(addressesOf(data)).toStrictEqual([ADDR_A, ADDR_B]);
  });

  it('extracts an arbitrarily-named address field in an unknown schema', () => {
    const data = build(
      'Weird',
      {
        Weird: [
          { name: 'maker', type: 'address' },
          { name: 'superSecretSink', type: 'address' },
        ],
      },
      { maker: SIGNER, superSecretSink: ADDR_A },
    );
    expect(addressesOf(data, { exclude: [SIGNER] })).toStrictEqual([ADDR_A]);
  });

  it('ignores non-address typed fields even if the value looks like an address', () => {
    const data = build(
      'T',
      {
        T: [
          { name: 'owner', type: 'address' },
          { name: 'notAnAddress', type: 'uint256' },
          { name: 'blob', type: 'bytes32' },
        ],
      },
      // notAnAddress carries an address-shaped string but is typed uint256.
      { owner: ADDR_A, notAnAddress: ADDR_B, blob: `0x${'ab'.repeat(32)}` },
    );
    expect(addressesOf(data)).toStrictEqual([ADDR_A]);
  });

  it('canonicalizes to lower case and de-duplicates case-insensitively', () => {
    const lower = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const upper = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD';
    const data = build(
      'Two',
      {
        Two: [
          { name: 'to', type: 'address' },
          { name: 'recipient', type: 'address' },
        ],
      },
      { to: lower, recipient: upper },
    );
    expect(addressesOf(data)).toStrictEqual([lower]);
  });

  it('excludes the zero address and provided addresses', () => {
    const data = build(
      'Three',
      {
        Three: [
          { name: 'a', type: 'address' },
          { name: 'b', type: 'address' },
          { name: 'c', type: 'address' },
        ],
      },
      { a: ZERO, b: SIGNER, c: ADDR_A },
    );
    expect(addressesOf(data, { exclude: [SIGNER] })).toStrictEqual([ADDR_A]);
  });

  it('honors excludeFields (e.g. spender handled by another hook)', () => {
    const data = build(
      'Permit',
      {
        Permit: [
          { name: 'spender', type: 'address' },
          { name: 'to', type: 'address' },
        ],
      },
      { spender: ADDR_A, to: ADDR_B },
    );
    expect(addressesOf(data, { excludeFields: ['spender'] })).toStrictEqual([
      ADDR_B,
    ]);
  });

  it('only excludes fields at the top level', () => {
    const data = build(
      'Order',
      {
        Order: [
          { name: 'spender', type: 'address' },
          { name: 'inner', type: 'Inner' },
        ],
        Inner: [{ name: 'spender', type: 'address' }],
      },
      { spender: ADDR_A, inner: { spender: ADDR_B } },
    );
    expect(addressesOf(data, { excludeFields: ['spender'] })).toStrictEqual([
      ADDR_B,
    ]);
  });

  it('normalizes decimal and non-canonical hex address encodings', () => {
    const data = build(
      'Batch',
      {
        Batch: [
          { name: 'a', type: 'address' },
          { name: 'b', type: 'address' },
        ],
      },
      { a: BigInt(ADDR_A).toString(10), b: '0x1' },
    );
    expect(addressesOf(data)).toStrictEqual([
      ADDR_A,
      '0x0000000000000000000000000000000000000001',
    ]);
  });

  it('canonicalizes mixed-case addresses to lower case', () => {
    const mixed = '0xAbCdEf0000000000000000000000000000000001';
    const data = build(
      'X',
      { X: [{ name: 'a', type: 'address' }] },
      { a: mixed },
    );
    expect(addressesOf(data)).toStrictEqual([mixed.toLowerCase()]);
  });

  it('reduces an oversized decimal-encoded address to the signed address', () => {
    // The signer reduces an `address` mod 2^160, so `value + 2^160` signs as
    // `value`. The extractor must resolve it to the same address.
    const oversized = (BigInt(ADDR_A) + 2n ** 160n).toString(10);
    const data = build(
      'X',
      { X: [{ name: 'a', type: 'address' }] },
      { a: oversized },
    );
    expect(addressesOf(data)).toStrictEqual([ADDR_A]);
  });

  it('bounds traversal work for a very large array', () => {
    const huge = Array.from({ length: 100000 }, () => ADDR_A);
    const data = build(
      'Batch',
      { Batch: [{ name: 'recipients', type: 'address[]' }] },
      { recipients: huge },
    );
    // Returns the distinct address without walking every element.
    expect(addressesOf(data)).toStrictEqual([ADDR_A]);
  });

  it('does not flag overflow at exactly the cap', () => {
    const data = build(
      'Airdrop',
      { Airdrop: [{ name: 'recipients', type: 'address[]' }] },
      { recipients: nAddresses(10) },
    );
    const result = extractSignatureAddresses(data);
    expect(result.addresses).toHaveLength(10);
    expect(result.overflow).toBe(false);
  });

  it('caps returned addresses and flags overflow past the cap', () => {
    const data = build(
      'Airdrop',
      { Airdrop: [{ name: 'recipients', type: 'address[]' }] },
      { recipients: nAddresses(15) },
    );
    const result = extractSignatureAddresses(data);
    expect(result.addresses).toHaveLength(10);
    expect(result.overflow).toBe(true);
  });

  it('flags overflow when the work budget truncates the walk', () => {
    // A long run of non-address nodes ahead of a trailing address exhausts the
    // node budget, so the address is never reached.
    const pad = Array.from({ length: 6000 }, (_, i) => i);
    const data = build(
      'Batch',
      {
        Batch: [
          { name: 'pad', type: 'uint256[]' },
          { name: 'evil', type: 'address' },
        ],
      },
      { pad, evil: ADDR_A },
    );
    const result = extractSignatureAddresses(data);
    expect(result.addresses).toStrictEqual([]);
    expect(result.overflow).toBe(true);
  });

  it('flags overflow when nesting exceeds the depth limit', () => {
    const depth = 14;
    const types: Record<string, { name: string; type: string }[]> = {};
    for (let i = 0; i < depth; i++) {
      types[`L${i}`] = [
        i < depth - 1
          ? { name: 'next', type: `L${i + 1}` }
          : { name: 'addr', type: 'address' },
      ];
    }
    let message: Record<string, unknown> = { addr: ADDR_A };
    for (let i = depth - 2; i >= 0; i--) {
      message = { next: message };
    }
    const result = extractSignatureAddresses(build('L0', types, message));
    expect(result.addresses).toStrictEqual([]);
    expect(result.overflow).toBe(true);
  });

  it('reports the field name each address was found under', () => {
    const data = build(
      'T',
      {
        T: [
          { name: 'to', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
      },
      { to: ADDR_A, spender: ADDR_B },
    );
    expect(extractSignatureAddresses(data).fields).toStrictEqual({
      [ADDR_A]: 'to',
      [ADDR_B]: 'spender',
    });
  });

  it('returns [] for nullish payloads, missing types, or unknown primaryType', () => {
    expect(addressesOf(undefined)).toStrictEqual([]);
    expect(addressesOf(null)).toStrictEqual([]);
    expect(
      addressesOf({ primaryType: 'X', message: { to: ADDR_A } }),
    ).toStrictEqual([]);
    expect(
      addressesOf({
        types: { Y: [{ name: 'to', type: 'address' }] },
        primaryType: 'X',
        message: { to: ADDR_A },
      }),
    ).toStrictEqual([]);
  });
});

// Chains added when syncing with @metamask/phishing-controller@17.3.0
// (see ADDRESS_SCAN_SUPPORTED_CHAINS in that package).
const SYNCED_CHAINS: [string, SupportedEVMChain][] = [
  ['0x13b2', SupportedEVMChain.Arc],
  ['0x3e7', SupportedEVMChain.Hyperevm],
  ['0x2019', SupportedEVMChain.Kaia],
  ['0xb67d2', SupportedEVMChain.Katana],
  ['0x93e', SupportedEVMChain.KiteAi],
  ['0x1388', SupportedEVMChain.Mantle],
  ['0x10e6', SupportedEVMChain.Megaeth],
  ['0x8f', SupportedEVMChain.Monad],
  ['0x279f', SupportedEVMChain.MonadTestnet],
  ['0x2611', SupportedEVMChain.Plasma],
  ['0x18232', SupportedEVMChain.Plume],
  ['0x1237', SupportedEVMChain.Robinhood],
  ['0x1079', SupportedEVMChain.Tempo],
  ['0xa5bf', SupportedEVMChain.TempoTestnet],
  ['0xc4', SupportedEVMChain.Xlayer],
];

describe('mapChainIdToSupportedEVMChain', () => {
  SYNCED_CHAINS.forEach(([chainId, expected]) => {
    it(`maps ${chainId} to ${expected}`, () => {
      expect(mapChainIdToSupportedEVMChain(chainId)).toBe(expected);
    });
  });

  it('is case-insensitive on the chainId', () => {
    expect(mapChainIdToSupportedEVMChain('0X13B2')).toBe(SupportedEVMChain.Arc);
  });

  it('returns undefined for an unknown chainId', () => {
    expect(mapChainIdToSupportedEVMChain('0xdeadbeef')).toBeUndefined();
  });
});
