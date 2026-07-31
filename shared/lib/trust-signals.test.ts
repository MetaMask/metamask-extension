import { mapChainIdToSupportedEVMChain } from './trust-signals';

// ADDRESS_SCAN_SUPPORTED_CHAINS and DEFAULT_CHAIN_ID_TO_NAME are not exported
// from @metamask/phishing-controller's package root (its exports field only
// exposes '.'), so resolve dist/types.cjs by absolute path. Absolute-path
// require bypasses the exports field. Remove this indirection once core
// exports these values.
// eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-dynamic-require
const controllerTypes = require(
  require
    .resolve('@metamask/phishing-controller')
    .replace(/index\.cjs$/u, 'types.cjs'),
);

const ADDRESS_SCAN_SUPPORTED_CHAINS: string[] =
  controllerTypes.ADDRESS_SCAN_SUPPORTED_CHAINS;
const DEFAULT_CHAIN_ID_TO_NAME: Record<string, string> =
  controllerTypes.DEFAULT_CHAIN_ID_TO_NAME;

describe('trust-signals chain map vs @metamask/phishing-controller', () => {
  it('exposes the controller chain list used by this test', () => {
    expect(ADDRESS_SCAN_SUPPORTED_CHAINS.length).toBeGreaterThan(0);
    expect(Object.keys(DEFAULT_CHAIN_ID_TO_NAME).length).toBeGreaterThan(0);
  });

  it('maps every address-scan-supported chain the controller screens', () => {
    const screened = Object.entries(DEFAULT_CHAIN_ID_TO_NAME).filter(
      ([, slug]) => ADDRESS_SCAN_SUPPORTED_CHAINS.includes(slug),
    );
    const unreachable = screened.filter(
      ([chainId, slug]) => mapChainIdToSupportedEVMChain(chainId) !== slug,
    );
    expect(unreachable).toEqual([]);
  });
});
