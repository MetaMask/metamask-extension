import * as path from 'path';
import {
  DAPP_URL,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';

import FixtureBuilder from '../../fixture-builder';

describe('Multichain Connect', function () {
  it('should connect to the multichain test dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        dappPaths: [
          path.join(
            '..',
            '..',
            'node_modules',
            '@metamask',
            'test-dapp-multichain',
            'build',
          ),
        ],
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .build(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        await openDapp(driver, undefined, DAPP_URL);

        // TODO need data-testid for input

        await driver.clickElement({ text: 'Connect', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
      },
    );
  });
});
