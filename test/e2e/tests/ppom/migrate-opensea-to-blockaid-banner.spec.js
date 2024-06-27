const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  logInWithBalanceValidation,
  withFixtures,
  openDapp,
  WINDOW_TITLES,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

describe('Migrate Opensea to Blockaid Banner @no-mmi', function () {
  const ONE_CLICK_CONFIRMATIONS_USING_BLOCKAID = [
    { name: 'Personal Sign signature', testDAppBtnId: 'personalSign' },
    { name: 'Sign Typed Data signature', testDAppBtnId: 'signTypedData' },
    { name: 'Sign Typed Data v3 signature', testDAppBtnId: 'signTypedDataV3' },
    { name: 'Sign Typed Data v4 signature', testDAppBtnId: 'signTypedDataV4' },
    { name: 'Sign Permit signature', testDAppBtnId: 'signPermit' },
    { name: 'Simple Send transaction', testDAppBtnId: 'sendButton' },
    {
      name: 'Contract Interaction transaction',
      testDAppBtnId: 'deployMultisigButton',
    },
  ];

  ONE_CLICK_CONFIRMATIONS_USING_BLOCKAID.forEach((confirmation) => {
    it(`Shows up on ${confirmation.name} confirmations`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPreferencesController({
              hasMigratedFromOpenSeaToBlockaid: true,
            })
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          await logInWithBalanceValidation(driver, ganacheServer);
          await openDapp(driver);

          await driver.clickElement(`#${confirmation.testDAppBtnId}`);
          await driver.delay(2000);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.waitForSelector({ text: 'Heads up!', tag: 'p' });
        },
      );
    });
  });

  it('Shows up on Token Approval transaction confirmations', async function () {
    const smartContract = SMART_CONTRACTS.HST;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController({ hasMigratedFromOpenSeaToBlockaid: true })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);
        await openDapp(driver, contractAddress);

        await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });
        await driver.delay(2000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Heads up!', tag: 'p' });
      },
    );
  });
});
