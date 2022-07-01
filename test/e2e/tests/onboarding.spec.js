const { strict: assert } = require('assert');
const path = require('path');
const {
  convertToHexValue,
  withFixtures,
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
} = require('../helpers');


describe('Going through the first time flow', function () {
  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
  const testPassword = 'correct horse battery staple';

  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

    it('clicks create a new wallet, accepts a secure password, reveals the Secret Recovery Phrase, confirm SRP', async function () {

          await withFixtures(
            {
              fixtures: 'onboarding',
              ganacheOptions,
              title: this.test.title,
              failOnConsoleError: false,
            },
            async ({ driver }) => {
              await driver.navigate();

             await completeImportSRPOnboardingFlow(
                driver,
                testSeedPhrase,
                testPassword,
              );
    },
        );
  });
});