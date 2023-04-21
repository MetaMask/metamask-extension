const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');
const FixtureBuilder = require('../fixture-builder');

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

  it('user should be able to view ERC1155 NFT details', async function () {
    const expectedImageSource =
      'https://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi.ipfs.dweb.link';
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
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Click to open the NFT details page and check displayed account
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        const importedNftImage = await driver.findVisibleElement(
          '.nfts-items__item img',
        );
        await importedNftImage.click();
        const detailsPageAccount = await driver.findElement(
          '.asset-breadcrumb span:nth-of-variant(2)',
        );
        assert.equal(await detailsPageAccount.getText(), 'Account 1');

        // Check the displayed ERC1155 NFT details
        const nftName = await driver.findElement('.nft-details__info h4');
        assert.equal(await nftName.getText(), 'Rocks');

        const nftDescription = await driver.findElement(
          '.nft-details__info h6:nth-of-variant(2)',
        );
        assert.equal(
          await nftDescription.getText(),
          'This is a collection of Rock NFTs.',
        );

        const nftImage = await driver.findElement('.nft-details__image');
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
