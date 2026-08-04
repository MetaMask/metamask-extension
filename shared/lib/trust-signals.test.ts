import {
  mapChainIdToSupportedEVMChain,
  SupportedEVMChain,
} from './trust-signals';

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
