const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Prevents switching to a deprecated network', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it(`tries to switch to a deprecated network`, async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkController({
          networkConfigurations: {
            networkConfigurationId: {
              rpcUrl: 'http://127.0.0.1:8545',
              chainId: '0x539',
              ticker: 'ETH',
              nickname: 'Test',
              rpcPrefs: {},
            },
            networkConfigurationId2: {
              rpcUrl:
                'https://rinkeby.infura.io/3/9aa3d95b3bc440fa88ea12eaa4456161',
              chainId: '0x539',
              ticker: 'ETH',
              nickname: 'Rinkeby Infura',
              rpcPrefs: {},
            },
          },
        })
        .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.waitForElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Rinkeby Infura', tag: 'span' });

        await driver.findElement({
          text: 'The current rpc url for this network has been deprecated.',
          tag: 'div',
        });

        await driver.clickElement({ text: 'Switch networks', tag: 'button' });

        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Test', tag: 'span' });

        await driver.waitForElementNotPresent('.loading-overlay');
      },
    );
  });
});
