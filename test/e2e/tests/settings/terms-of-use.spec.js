const {
  defaultGanacheOptions,
  withSetup,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Terms of use', function () {
  const localSetup = withSetup();
  it('accepts the updated terms of use @no-mmi', async function () {
    const firstOfJan = 1672574400;
    const { driver } = await localSetup.start({
      fixtures: new FixtureBuilder()
        .withAppStateController({
          termsOfUseLastAgreed: firstOfJan,
        })
        .build(),
      ganacheOptions: defaultGanacheOptions,
      title: this.test.fullTitle(),
    });
    await unlockWallet(driver);

    // accept updated terms of use
    const acceptTerms = '[data-testid="terms-of-use-accept-button"]';
    await driver.clickElement('[data-testid="popover-scroll-button"]');
    await driver.clickElement('[data-testid="terms-of-use-checkbox"]');
    await driver.clickElementAndWaitToDisappear(acceptTerms);
  });
});
