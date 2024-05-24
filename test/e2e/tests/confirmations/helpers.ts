import { strict as assert } from 'assert';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

export async function scrollAndConfirmAndAssertConfirm (driver: Driver) {
  const confirmButton = await driver.findElement({ xpath: '//button[@data-testid="confirm-footer-button"]'});

  // clicking the confirm button doesn't close the dialog since it's disabled
  confirmButton.getAttribute('disabled').then((disabled) => {
    assert.equal(disabled, true);
  });

  // scroll to the bottom which enables the confirm button
  await driver.clickElement('.confirm-scroll-to-bottom__button');

  // click the confirm button which closes the dialog
  confirmButton.getAttribute('disabled').then((disabled) => {
    assert.equal(disabled, null);
  });
  await driver.clickElement('[data-testid="confirm-footer-button"]')
}

export function withRedesignConfirmationFixtures (title: string = '', testFunction: Function) {
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