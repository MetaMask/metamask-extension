import { parseScanContent } from './scan-util';

describe('Extract Address from string', () => {
  it('should correctly extract the address from the string', () => {
    const result = parseScanContent(
      'ethereum:0xCf464B40cb2419944138F24514C9aE4D1889ccC1',
    );
    expect(result).toStrictEqual('0xCf464B40cb2419944138F24514C9aE4D1889ccC1');
  });

  it('should correctly extract the address from the string when there is a 0x appended', () => {
    const result = parseScanContent(
      'ethereum:0xCf464B40cb2419944138F24514C9aE4D1889ccC1@0x1',
    );
    expect(result).toStrictEqual('0xCf464B40cb2419944138F24514C9aE4D1889ccC1');
  });

  it('should return null if there is no address to extract that matches the pattern', () => {
    const result = parseScanContent(
      'ethereum:0xCf464B40cb2419944138F24514C9aE4D1',
    );
    expect(result).toStrictEqual(null);
  });
});
