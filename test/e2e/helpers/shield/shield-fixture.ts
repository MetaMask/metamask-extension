import FixtureBuilder from '../../fixture-builder';

export function createShieldFixture(): FixtureBuilder {
  return new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
      },
    })
    .withTokensController({
      allTokens: {
        '0x1': {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              symbol: 'WETH',
              decimals: 18,
              isERC721: false,
              aggregators: [],
            },
          ],
        },
      },
    })
    .withAppStateController({
      showShieldEntryModalOnce: null,
    });
}

export function createShieldFixtureWithOnboarding(): FixtureBuilder {
  return new FixtureBuilder({ onboarding: true }).withAppStateController({
    showShieldEntryModalOnce: null,
  });
}

export function createShieldFixtureWithExternalServicesDisabled(): FixtureBuilder {
  return new FixtureBuilder()
    .withPreferencesController({
      useExternalServices: false,
    })
    .withAppStateController({
      showShieldEntryModalOnce: null,
    });
}
