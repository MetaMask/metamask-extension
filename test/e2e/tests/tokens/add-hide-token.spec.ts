import { toHex } from '@metamask/controller-utils';
import { withFixtures } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import FixtureBuilder from '../../fixtures/fixture-builder';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Add hide token', function () {
  const smartContract = SMART_CONTRACTS.HST;
  it('hides the token when clicked', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({ eip155: { '0x539': true } })
          .withTokensController({
            allTokens: {
              [toHex(1337)]: {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
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
                address: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
                decimals: 4,
                image: null,
                isERC721: false,
                symbol: 'TST',
              },
            ],
          })
          .withTokenBalancesController({
            tokenBalances: {
              '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
                [toHex(1337)]: {
                  '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947': '0x186a0', // 100000 in hex (10 TST with 4 decimals)
                },
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        smartContract,
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenItemNumber(2);
        await assetListPage.checkTokenAmountIsDisplayed('10 TST');

        await assetListPage.hideToken('TST');
        await assetListPage.checkTokenItemNumber(1);
      },
    );
  });
});
