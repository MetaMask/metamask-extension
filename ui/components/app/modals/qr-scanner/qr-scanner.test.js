import { parseContent } from './qr-scanner.component';

describe('QR Scanner parseContent', () => {
  it('should parse ethereum prefixed addresses', () => {
    const result = parseContent(
      'ethereum:0x1234567890123456789012345678901234567890',
    );
    expect(result).toStrictEqual({
      type: 'address',
      values: { address: '0x1234567890123456789012345678901234567890' },
    });
  });

  it('should parse plain Ethereum addresses', () => {
    const result = parseContent('0x1234567890123456789012345678901234567890');
    expect(result).toStrictEqual({
      type: 'address',
      values: { address: '0x1234567890123456789012345678901234567890' },
    });
  });

  // New test cases for unknown types
  it('should return unknown type for invalid ethereum prefix format', () => {
    const result = parseContent('ethereum:0x123'); // too short
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  it('should return unknown type for non-address format', () => {
    const result = parseContent('hello world');
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  it('should return unknown type for invalid hex address', () => {
    const result = parseContent('0xZZZZ567890123456789012345678901234567890'); // invalid hex
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  it('should return unknown type for address with wrong length', () => {
    const result = parseContent('0x12345678901234567890123456789012345678901'); // 41 chars instead of 40
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  // New EIP-681 format tests
  it('should return unknown type for ERC20 transfer format', () => {
    const result = parseContent(
      'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1',
    );
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  it('should return unknown type for pay with gas parameters', () => {
    const result = parseContent(
      'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7?value=1&gasPrice=100',
    );
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  it('should return unknown type for contract function calls', () => {
    const result = parseContent(
      'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7/transfer(address,uint256)?address=0x8e23ee67d1332ad560396262c48ffbb01f93d052&uint256=1',
    );
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  it('should return unknown type for ENS names', () => {
    const result = parseContent('ethereum:vitalik.eth');
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });

  it('should return unknown type for value parameter', () => {
    const result = parseContent(
      'ethereum:0x89205a3a3b2a69de6dbf7f01ed13b2108b2c43e7?value=2.014e18',
    );
    expect(result).toStrictEqual({
      type: 'unknown',
      values: {},
    });
  });
});
