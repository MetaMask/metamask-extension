import {
  EMPTY_RELAY_FIXED_SPREAD_CONFIG,
  getRelayFixedSpreadFromConfig,
  isRouteToken,
  isSubsidizedRoute,
  isSubsidizedSource,
} from './relay-fixed-spread';

const ETH_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const ETH_MUSD = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const LINEA_USDC = '0x176211869ca2b568f2a7d4ee941e073a821ee1ff';

const FLAG_NAME = 'confirmations_relay_fixed_spread';

/* eslint-disable @typescript-eslint/naming-convention -- flag aliases use snake_case keys */
const withRoutes = (routes: unknown[]) => ({
  chains: { eth: '0x1' },
  tokens: { eth_usdc: ETH_USDC, musd: ETH_MUSD },
  routes,
});
/* eslint-enable @typescript-eslint/naming-convention */

const samplePayload = withRoutes([['eth', 'eth_usdc', 'eth', 'musd']]);

const expectedRoute = {
  sourceChain: '0x1',
  sourceToken: ETH_USDC,
  targetChain: '0x1',
  targetToken: ETH_MUSD,
};

describe('getRelayFixedSpreadFromConfig', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('resolves aliases into normalised routes when remote value is a valid object', () => {
    const result = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(result.routes).toEqual([expectedRoute]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('parses remote value provided as a JSON string', () => {
    const result = getRelayFixedSpreadFromConfig(
      JSON.stringify(samplePayload),
      FLAG_NAME,
    );

    expect(result.routes).toEqual([expectedRoute]);
  });

  it('lowercases mixed-case addresses and chain ids on resolution', () => {
    const result = getRelayFixedSpreadFromConfig(
      {
        chains: { linea: '0xE708' },
        /* eslint-disable @typescript-eslint/naming-convention -- flag aliases use snake_case keys */
        tokens: {
          linea_usdc: '0x176211869CA2B568F2A7D4EE941E073A821EE1FF',
          musd: '0xACA92E438DF0B2401FF60DA7E4337B687A2435DA',
        },
        /* eslint-enable @typescript-eslint/naming-convention */
        routes: [['linea', 'linea_usdc', 'linea', 'musd']],
      },
      FLAG_NAME,
    );

    expect(result.routes).toEqual([
      {
        sourceChain: '0xe708',
        sourceToken: LINEA_USDC,
        targetChain: '0xe708',
        targetToken: ETH_MUSD,
      },
    ]);
  });

  it('drops routes referencing an unknown chain alias', () => {
    const result = getRelayFixedSpreadFromConfig(
      withRoutes([
        ['eth', 'eth_usdc', 'eth', 'musd'],
        ['mystery_chain', 'eth_usdc', 'eth', 'musd'],
      ]),
      FLAG_NAME,
    );

    expect(result.routes).toEqual([expectedRoute]);
  });

  it('warns and returns empty when remote JSON is malformed', () => {
    const result = getRelayFixedSpreadFromConfig('{not-valid-json', FLAG_NAME);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to parse remote'),
    );
    expect(result).toEqual(EMPTY_RELAY_FIXED_SPREAD_CONFIG);
  });

  it('returns empty without warning when remote is undefined', () => {
    const result = getRelayFixedSpreadFromConfig(undefined, FLAG_NAME);

    expect(result).toEqual(EMPTY_RELAY_FIXED_SPREAD_CONFIG);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

describe('isSubsidizedSource', () => {
  it('returns true when a route source matches', () => {
    const config = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(
      isSubsidizedSource(config, { address: ETH_USDC, chainId: '0x1' }),
    ).toBe(true);
  });

  it('returns false when no route source matches', () => {
    const config = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(
      isSubsidizedSource(config, { address: ETH_MUSD, chainId: '0x1' }),
    ).toBe(false);
  });
});

describe('isRouteToken', () => {
  it('returns true when the token is a route source', () => {
    const config = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(isRouteToken(config, { address: ETH_USDC, chainId: '0x1' })).toBe(
      true,
    );
  });

  it('returns true when the token is a route target', () => {
    const config = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(isRouteToken(config, { address: ETH_MUSD, chainId: '0x1' })).toBe(
      true,
    );
  });

  it('returns false when the token is not on any route', () => {
    const config = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(
      isRouteToken(config, { address: LINEA_USDC, chainId: '0xe708' }),
    ).toBe(false);
  });
});

describe('isSubsidizedRoute', () => {
  it('returns true for an exact source → target route', () => {
    const config = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(
      isSubsidizedRoute(
        config,
        { address: ETH_USDC, chainId: '0x1' },
        { address: ETH_MUSD, chainId: '0x1' },
      ),
    ).toBe(true);
  });

  it('returns false when the target does not match', () => {
    const config = getRelayFixedSpreadFromConfig(samplePayload, FLAG_NAME);

    expect(
      isSubsidizedRoute(
        config,
        { address: ETH_USDC, chainId: '0x1' },
        { address: LINEA_USDC, chainId: '0x1' },
      ),
    ).toBe(false);
  });
});
