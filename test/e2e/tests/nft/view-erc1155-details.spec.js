const {
  convertToHexValue,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

describe('View ERC1155 NFT details', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('user should be able to view ERC1155 NFT details @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC1155().build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        // Click to open the NFT details page and check displayed account
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement('.nft-item__container');

        await driver.findElement({
          css: '.asset-breadcrumb span:nth-of-type(2)',
          text: 'Account 1',
        });

        // Check the displayed ERC1155 NFT details
        await driver.findElement({
          css: '.nft-details__info h4',
          text: 'Rocks',
        });

        await driver.findElement({
          css: '.nft-details__info h6:nth-of-type(2)',
          text: 'This is a collection of Rock NFTs.',
        });

        await driver.findVisibleElement('.nft-item__container');

        await driver.findElement({
          css: '.nft-details__contract-wrapper',
          text: '0x581c3...45947',
        });
      },
    );
  });
});
