import { Mockttp } from 'mockttp';
import { MultichainNetworks } from '../../../../../shared/constants/multichain/networks';

/**
 * Mocks the ramps catalog endpoints (countries, region tokens, providers and
 * payment methods) with a populated US-TX catalog containing only DAI, so
 * the `/buy` deep link can pre-select its token deterministically and no
 * unmocked pass-through requests occur.
 *
 * @param server - The Mockttp server instance.
 */
export const mockRampsCatalog = async (server: Mockttp): Promise<void> => {
  const region = 'us-tx'; // matches the mocked geolocation response (US-TX)
  const hosts = [
    'on-ramp-cache.api.cx.metamask.io',
    'on-ramp-cache.uat-api.cx.metamask.io',
    'on-ramp.dev-api.cx.metamask.io',
  ];

  // Overrides the empty countries list mocked globally in mock-e2e.js, so
  // RampsController.init can resolve the geolocation result ('US-TX') into a
  // supported user region and the flow can fetch providers/tokens for it.
  const country = {
    isoCode: 'US',
    flag: '🇺🇸',
    name: 'United States',
    phone: { prefix: '+1', placeholder: '(201) 555-0123', template: '+1' },
    currency: 'usd',
    supported: { buy: true, sell: true },
    states: [
      { stateId: 'tx', name: 'Texas', supported: { buy: true, sell: true } },
    ],
  };

  // The checksummed spelling the deep-link intent produces for the DAI
  // address in the /buy scenarios; the controller selects tokens by exact
  // assetId, so the catalog must carry the same spelling.
  const daiToken = {
    assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
    chainId: 'eip155:1',
    name: 'DAI',
    symbol: 'DAI',
    decimals: 18,
    iconUrl: '',
    tokenSupported: true,
  };

  const provider = {
    id: 'transak',
    name: 'Transak',
    environmentType: 'production',
    description: 'Buy crypto with Transak',
    hqAddress: '',
    links: [],
    logos: { light: '', dark: '', height: 32, width: 96 },
  };

  for (const host of hosts) {
    await server
      .forGet(`https://${host}/v2/regions/countries`)
      .thenJson(200, [country]);
    await server
      .forGet(`https://${host}/v2/regions/${region}/topTokens`)
      .thenJson(200, { topTokens: [daiToken], allTokens: [daiToken] });
    await server
      .forGet(`https://${host}/v2/regions/${region}/providers`)
      .thenJson(200, { providers: [provider] });
    // Fetched automatically when a token is pre-selected.
    await server
      .forGet(`https://${host}/v2/regions/${region}/payments`)
      .thenJson(200, { payments: [] });
  }
};

export async function mockRampsDynamicFeatureFlag(
  mockServer: Mockttp,
  subDomain: string,
) {
  return await mockServer
    .forGet(
      `https://on-ramp-content.${subDomain}.cx.metamask.io/regions/networks`,
    )
    .withQuery({
      context: 'browser',
    })
    .thenJson(200, {
      networks: [
        {
          active: true,
          chainId: MultichainNetworks.BITCOIN,
          chainName: 'Bitcoin',
          shortName: 'Bitcoin',
          nativeTokenSupported: true,
          isEvm: false,
        },
      ],
    });
}
