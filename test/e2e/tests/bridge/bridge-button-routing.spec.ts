import { Suite } from 'mocha';
import { logInWithBalanceValidation, withFixtures } from '../../helpers';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';
import { DEFAULT_BRIDGE_FEATURE_FLAGS } from './constants';

describe('Click bridge button', function (this: Suite) {
  it('loads placeholder swap route from wallet overview when flag is turned on', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle(), {
        'extension-config': {
          ...DEFAULT_BRIDGE_FEATURE_FLAGS['extension-config'],
          support: true,
        },
      }),
      async ({ driver }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver);
        await bridgePage.navigateToBridgePage();
        await bridgePage.verifySwapPage();
      },
    );
  });
});
