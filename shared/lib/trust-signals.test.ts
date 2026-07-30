import { extractSignatureAddresses } from './trust-signals';

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
    expect(extractSignatureAddresses(data, { exclude: [SIGNER] })).toEqual([
      ADDR_A,
    ]);
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
    expect(extractSignatureAddresses(data, { exclude: [SIGNER] })).toEqual([
      ADDR_A,
    ]);
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
    expect(extractSignatureAddresses(data, { exclude: [SIGNER] })).toEqual([
      ADDR_A,
    ]);
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
    expect(extractSignatureAddresses(data, { exclude: [SIGNER] })).toEqual([
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
    expect(extractSignatureAddresses(data)).toEqual([ADDR_A, ADDR_B, ADDR_C]);
  });

  it('extracts an `address[]` field', () => {
    const data = build(
      'Airdrop',
      { Airdrop: [{ name: 'recipients', type: 'address[]' }] },
      { recipients: [ADDR_A, ADDR_B] },
    );
    expect(extractSignatureAddresses(data)).toEqual([ADDR_A, ADDR_B]);
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
    expect(extractSignatureAddresses(data, { exclude: [SIGNER] })).toEqual([
      ADDR_A,
    ]);
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
    expect(extractSignatureAddresses(data)).toEqual([ADDR_A]);
  });

  it('de-duplicates case-insensitively, preserving first casing', () => {
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
    expect(extractSignatureAddresses(data)).toEqual([lower]);
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
    expect(extractSignatureAddresses(data, { exclude: [SIGNER] })).toEqual([
      ADDR_A,
    ]);
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
    expect(
      extractSignatureAddresses(data, { excludeFields: ['spender'] }),
    ).toEqual([ADDR_B]);
  });

  it('caps the number of returned addresses', () => {
    const many = Array.from(
      { length: 20 },
      (_, i) => `0x${(i + 1).toString(16).padStart(2, '0').repeat(20)}`,
    );
    const data = build(
      'Airdrop',
      { Airdrop: [{ name: 'recipients', type: 'address[]' }] },
      { recipients: many },
    );
    expect(extractSignatureAddresses(data)).toHaveLength(10);
  });

  it('returns [] for nullish payloads, missing types, or unknown primaryType', () => {
    expect(extractSignatureAddresses(undefined)).toEqual([]);
    expect(extractSignatureAddresses(null)).toEqual([]);
    expect(
      extractSignatureAddresses({ primaryType: 'X', message: { to: ADDR_A } }),
    ).toEqual([]);
    expect(
      extractSignatureAddresses({
        types: { Y: [{ name: 'to', type: 'address' }] },
        primaryType: 'X',
        message: { to: ADDR_A },
      }),
    ).toEqual([]);
  });
});
