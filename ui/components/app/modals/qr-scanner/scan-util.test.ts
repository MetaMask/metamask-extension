import { parseScanContent } from './scan-util';

describe('QR Scanner parseScanContent', () => {
  it('should parse ethereum prefixed addresses', () => {
    const result = parseScanContent(
      'ethereum:0x1234567890123456789012345678901234567890',
    );
    expect(result).toBe('0x1234567890123456789012345678901234567890');
  });

  it('should return null for invalid ethereum prefix format', () => {
    const result = parseScanContent('ethereum:0x123'); // too short
    expect(result).toBe(null);
  });

  it('should return null for non-address format', () => {
    const result = parseScanContent('hello world');
    expect(result).toBe(null);
  });

  it('should return null for invalid hex address', () => {
    const result = parseScanContent(
      'ethereum:0xZZZZ567890123456789012345678901234567890',
    ); // invalid hex
    expect(result).toBe(null);
  });

  it('should return null for address with wrong length', () => {
    const result = parseScanContent(
      'ethereum:0x12345678901234567890123456789012345678901',
    ); // 41 chars instead of 40
    expect(result).toBe(null);
  });

});
