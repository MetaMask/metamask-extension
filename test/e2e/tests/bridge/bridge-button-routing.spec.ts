import { Suite } from 'mocha';
import { logInWithBalanceValidation, withFixtures } from '../../helpers';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './constants';

describe('Click bridge button @no-mmi', function (this: Suite) {
  it('loads placeholder swap route from wallet overview when flag is turned on', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle(), {
        'extension-config': {
          ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
          support: true,
        },
      }),
      async ({ driver, ganacheServer }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);
        await bridgePage.navigateToBridgePage();
        await bridgePage.verifySwapPage(1);
      },
    );
  });
});
