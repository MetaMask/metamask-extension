import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  logInWithBalanceValidation,
  sendTransaction,
  withFixtures,
} from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Trezor Hardware', function (this: Suite) {
  it('send ETH', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withTrezorAccount().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        // Seed the Trezor account with balance
        await ganacheServer?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        );
        await logInWithBalanceValidation(driver);

        await sendTransaction(driver, RECIPIENT, '1');

        // Wait for transaction to be confirmed
        await driver.waitForSelector({
          css: '.transaction-status-label',
          text: 'Confirmed',
        });
      },
    );
  });
});
