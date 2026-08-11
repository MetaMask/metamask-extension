import {
  isBnsRegistryConfigured,
  requireBareGatewayHost,
  requireNonZeroAddress,
  resolveBnsRuntimeConfig,
} from './config';

describe('shared/bns config (H1.3 fail-closed)', () => {
  const validRegistry = '0x2222222222222222222222222222222222222222';
  const validRpcs = [
    'https://rpc-a.example',
    'https://rpc-b.example',
    'https://rpc-c.example',
  ] as const;

  it('rejects empty, zero, and malformed registry addresses', () => {
    expect(() => requireNonZeroAddress('', 'BNS registry address')).toThrow(
      'not configured',
    );
    expect(() =>
      requireNonZeroAddress(
        '0x0000000000000000000000000000000000000000',
        'BNS registry address',
      ),
    ).toThrow('zero address');
    expect(() =>
      requireNonZeroAddress('0x1234', 'BNS registry address'),
    ).toThrow('20-byte');
    expect(requireNonZeroAddress(validRegistry, 'BNS registry address')).toBe(
      validRegistry,
    );
  });

  it('accepts only bare gateway hostnames', () => {
    expect(requireBareGatewayHost('ipfs.bearnetwork.net')).toBe(
      'ipfs.bearnetwork.net',
    );
    expect(() =>
      requireBareGatewayHost('https://ipfs.bearnetwork.net'),
    ).toThrow('bare hostname');
    expect(() => requireBareGatewayHost('ipfs.bearnetwork.net/path')).toThrow(
      'bare hostname',
    );
    expect(() => requireBareGatewayHost('1.2.3.4')).toThrow('IP literal');
  });

  it('builds a full runtime config only when all fields are safe', () => {
    const config = resolveBnsRuntimeConfig({
      registryAddress: validRegistry,
      gatewayHost: 'ipfs.bearnetwork.net',
      rpcUrls: validRpcs,
      timeoutMs: 5000,
    });
    expect(config).toStrictEqual({
      registryAddress: validRegistry,
      gatewayHost: 'ipfs.bearnetwork.net',
      rpcUrls: [
        'https://rpc-a.example',
        'https://rpc-b.example',
        'https://rpc-c.example',
      ],
      timeoutMs: 5000,
      oracleAddress: undefined,
    });
  });

  it('fails closed when registry seed is missing', () => {
    expect(() =>
      resolveBnsRuntimeConfig({
        registryAddress: '',
        rpcUrls: validRpcs,
      }),
    ).toThrow('not configured');
    expect(isBnsRegistryConfigured('')).toBe(false);
    expect(isBnsRegistryConfigured(validRegistry)).toBe(true);
  });
});
