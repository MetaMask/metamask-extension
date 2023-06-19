const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

describe('View NFT details', function () {
  const smartContract = SMART_CONTRACTS.NFTS;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('user should be able to view ERC721 NFT details', async function () {
    const expectedImageSource =
      'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==';
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions,
        smartContract,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Click to open the NFT details page and check title
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement('.nft-item__item-image');

        const detailsPageTitle = await driver.findElement('.asset-breadcrumb');
        assert.equal(
          await detailsPageTitle.getText(),
          'Account 1 / TestDappNFTs',
        );

        // Check the displayed NFT details
        const nftName = await driver.findElement('.nft-details__info h4');
        assert.equal(await nftName.getText(), 'Test Dapp NFTs #1');

        const nftDescription = await driver.findElement(
          '.nft-details__info h6:nth-of-type(2)',
        );
        assert.equal(
          await nftDescription.getText(),
          'Test Dapp NFTs for testing.',
        );

        const nftImage = await driver.findElement('.nft-item__item-image');
        assert.equal(await nftImage.isDisplayed(), true);

        const nftImageSource = await driver.findElement(
          '.nft-details__image-source',
        );
        assert.equal(await nftImageSource.getText(), expectedImageSource);

        const nftContract = await driver.findElement(
          '.nft-details__contract-wrapper',
        );
        assert.equal(await nftContract.getText(), '0x581...5947');
      },
    );
  });
});
