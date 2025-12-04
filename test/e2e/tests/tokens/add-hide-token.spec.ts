import { toHex } from '@metamask/controller-utils';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Add hide token', function () {
  it('hides the token when clicked', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTokensController({
            allTokens: {
              [toHex(1337)]: {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                    decimals: 4,
                    image: null,
                    isERC721: false,
                    symbol: 'TST',
                  },
                ],
              },
            },
            tokens: [
              {
                address: '0x86002be4cdd922de1ccb831582bf99284b99ac12',
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenItemNumber(2);
        await assetListPage.checkTokenAmountIsDisplayed('0 TST');

        await assetListPage.hideToken('TST');
        await assetListPage.checkTokenItemNumber(1);
      },
    );
  });
});
