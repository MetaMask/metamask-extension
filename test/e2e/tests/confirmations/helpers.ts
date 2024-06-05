import FixtureBuilder from '../../fixture-builder';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';

export async function scrollAndConfirmAndAssertConfirm(driver: Driver) {
  await driver.clickElement('.confirm-scroll-to-bottom__button');
  await driver.clickElement('[data-testid="confirm-footer-button"]');
}

export function withRedesignConfirmationFixtures(
  // Default params first is discouraged because it makes it hard to call the function without the
  // optional parameters. But it doesn't apply here because we're always passing in a variable for
  // title. It's optional because it's sometimes unset.
  // eslint-disable-next-line @typescript-eslint/default-param-last
  title: string = '',
  testFunction: Parameters<typeof withFixtures>[1],
) {
  return withFixtures(
    {
      dapp: true,
      driverOptions: {
        timeOut: 20000,
      },
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withPreferencesController({
          preferences: {
            redesignedConfirmationsEnabled: true,
          },
        })
        .build(),
      ganacheOptions: defaultGanacheOptions,
      title,
    },
    testFunction,
  );
}
