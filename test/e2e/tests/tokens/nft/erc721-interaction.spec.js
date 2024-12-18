const { strict: assert } = require('assert');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  defaultGanacheOptions,
  clickNestedButton,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

// describe('Old confirmation screens', function () {
//   // ...
// });

// describe('Redesigned confirmation screens', function () {
//   // ...
// });

describe('ERC721 NFTs testdapp interaction', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  describe('Old confirmation screens', function () {
    it('should add NFTs to state by parsing tx logs without having to click on watch NFT', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // mint NFTs
          await driver.fill('#mintAmountInput', '5');
          await driver.clickElement({ text: 'Mint', tag: 'button' });

          // Notification
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.waitForSelector({
            css: '.confirm-page-container-summary__action__name',
            text: 'Deposit',
          });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Deposit',
          });

          // verify the mint transaction has finished
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.waitForSelector({
            css: '#nftsStatus',
            text: 'Mint completed',
          });

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          await driver.findElement({ text: 'TestDappNFTs (5)' });
          const nftsListItemsFirstCheck = await driver.findElements(
            '.nft-item__container',
          );
          assert.equal(nftsListItemsFirstCheck.length, 5);
        },
      );
    });

    it('should prompt users to add their NFTs to their wallet (one by one) @no-mmi', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // mint NFT
          await driver.fill('#mintAmountInput', '5');
          await driver.clickElement({ text: 'Mint', tag: 'button' });

          // Notification
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.waitForSelector({
            css: '.confirm-page-container-summary__action__name',
            text: 'Deposit',
          });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Deposit',
          });

          // verify the mint transaction has finished
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const nftsMintStatus = await driver.findElement({
            css: '#nftsStatus',
            text: 'Mint completed',
          });
          assert.equal(await nftsMintStatus.isDisplayed(), true);

          // watch 3 of the nfts
          await driver.fill('#watchNFTInput', '1');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '2');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '3');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // avoid race condition
          await driver.waitForSelector({
            css: '.confirm-add-suggested-nft__nft-tokenId',
            text: '#3',
          });

          // confirm watchNFT
          await driver.waitForSelector({
            css: '.mm-text--heading-lg',
            text: 'Add suggested NFTs',
          });
          await driver.clickElement({ text: 'Add NFTs', tag: 'button' });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          // Changed this check from 3 to 6, because after mint all nfts has been added to state,
          await driver.findElement({ text: 'TestDappNFTs (6)' });
          const nftsListItemsFirstCheck = await driver.findElements(
            '.nft-item__container',
          );
          assert.equal(nftsListItemsFirstCheck.length, 6);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.fill('#watchNFTInput', '4');

          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '5');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '6');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // avoid race condition
          await driver.waitForSelector({
            css: '.confirm-add-suggested-nft__nft-tokenId',
            text: '#6',
          });

          // confirm watchNFT
          await driver.waitForSelector({
            css: '.mm-text--heading-lg',
            text: 'Add suggested NFTs',
          });
          await driver.clickElement({ text: 'Add NFTs', tag: 'button' });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          await driver.findElement({ text: 'TestDappNFTs (6)' });
          const nftsListItemsSecondCheck = await driver.findElements(
            '.nft-item__container',
          );
          assert.equal(nftsListItemsSecondCheck.length, 6);
        },
      );
    });

    it('should prompt users to add their NFTs to their wallet (all at once)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // mint NFT
          await driver.fill('#mintAmountInput', '5');
          await driver.clickElement({ text: 'Mint', tag: 'button' });

          // Notification
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.waitForSelector({
            css: '.confirm-page-container-summary__action__name',
            text: 'Deposit',
          });
          await driver.clickElementAndWaitForWindowToClose({
            text: 'Confirm',
            tag: 'button',
          });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );

          // We need to wait until the transaction is confirmed before looking for the tx
          // otherwise the element becomes stale, as it updates from 'pending' to 'confirmed'
          await driver.waitForSelector('.transaction-status-label--confirmed');

          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Deposit',
          });
          // verify the mint transaction has finished
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.waitForSelector({
            css: '#nftsStatus',
            text: 'Mint completed',
          });

          // watch all nfts
          await driver.clickElement({ text: 'Watch all NFTs', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // confirm watchNFT
          await driver.waitForSelector({
            css: '.mm-text--heading-lg',
            text: 'Add suggested NFTs',
          });

          await driver.findElements(
            '.confirm-add-suggested-nft__nft-list-item',
          );
          const suggestedNftListItems = await driver.findElements(
            '.confirm-add-suggested-nft__nft-list-item',
          );
          // there are 6 nfts to add because one is minted as part of the fixture
          assert.equal(suggestedNftListItems.length, 6);

          // remove one nft from the list
          const removeButtons = await driver.findElements(
            '.confirm-add-suggested-nft__nft-remove',
          );
          await removeButtons[0].click();

          await driver.clickElementAndWaitForWindowToClose({
            text: 'Add NFTs',
            tag: 'button',
          });

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          await driver.findElement({ text: 'TestDappNFTs (5)' });
          const nftsListItemsSecondCheck = await driver.findElements(
            '.nft-item__container',
          );

          assert.equal(nftsListItemsSecondCheck.length, 5);
        },
      );
    });

    it('should transfer a single ERC721 NFT from one account to another', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Click Transfer
          await driver.fill('#transferTokenInput', '1');
          await driver.clickElement('#transferFromButton');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Confirm transfer
          await driver.waitForSelector({
            css: '.mm-text--heading-md',
            text: 'TestDappNFTs',
          });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.findElement({ text: 'Send TDN' });
        },
      );
    });

    it('should approve an address to transfer a single ERC721 NFT', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Click Approve
          const approveInput = await driver.findElement('#approveTokenInput');
          await approveInput.clear();
          await approveInput.sendKeys('1');
          await driver.clickElement('#approveButton');

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Verify dialog
          const title = await driver.findElement(
            '[data-testid="confirm-approve-title"]',
          );
          await driver.clickElement({
            text: 'View full transaction details',
            css: '.confirm-approve-content__small-blue-text',
          });
          const [func] = await driver.findElements(
            '.confirm-approve-content__data .confirm-approve-content__small-text',
          );
          assert.equal(
            await title.getText(),
            'Allow access to and transfer of your TestDappNFTs (#1)?',
          );
          assert.equal(await func.getText(), 'Function: Approve');

          // Confirm approval
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Approve TDN spending cap',
          });
        },
      );
    });

    it('should enable approval for a third party address to manage all ERC721 NFTs @no-mmi', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Enable Set approval for all
          await driver.clickElement('#setApprovalForAllButton');
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Verify dialog
          const title = await driver.findElement(
            '[data-testid="confirm-approve-title"]',
          );
          await driver.clickElement({
            text: 'View full transaction details',
            css: '.confirm-approve-content__small-blue-text',
          });
          const [func, params] = await driver.findElements(
            '.confirm-approve-content__data .confirm-approve-content__small-text',
          );
          assert.equal(
            await title.getText(),
            'Allow access to and transfer of all your TestDappNFTs?',
          );
          assert.equal(await func.getText(), 'Function: SetApprovalForAll');
          assert.equal(await params.getText(), 'Parameters: true');

          // Confirm enabling set approval for all
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.clickElement({ text: 'Approve', tag: 'button' });

          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Approve TDN with no spend limit',
          });
        },
      );
    });

    it('should disable approval for a third party address to manage all ERC721 NFTs @no-mmi', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Disable Set approval for all
          await driver.clickElement('#revokeButton');
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Verify dialog
          const title = await driver.findElement(
            '[data-testid="confirm-approve-title"]',
          );
          await driver.clickElement({
            text: 'View full transaction details',
            css: '.confirm-approve-content__small-blue-text',
          });
          const [func, params] = await driver.findElements(
            '.confirm-approve-content__data .confirm-approve-content__small-text',
          );
          const proceedWithCautionIsDisplayed = await driver.isElementPresent(
            '.dialog--error',
          );
          assert.equal(
            await title.getText(),
            'Revoke permission to access and transfer all of your TestDappNFTs?',
          );
          assert.equal(await func.getText(), 'Function: SetApprovalForAll');
          assert.equal(await params.getText(), 'Parameters: false');
          assert.equal(proceedWithCautionIsDisplayed, false);

          // Confirm disabling set approval for all
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Approve TDN with no spend limit',
          });
        },
      );
    });
  });

  describe('Redesigned confirmation screens', function () {
    it('should add NFTs to state by parsing tx logs without having to click on watch NFT', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // mint NFTs
          await driver.fill('#mintAmountInput', '5');
          await driver.clickElement({ text: 'Mint', tag: 'button' });

          // Notification
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Deposit',
          });

          // verify the mint transaction has finished
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.waitForSelector({
            css: '#nftsStatus',
            text: 'Mint completed',
          });

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          await driver.findElement({ text: 'TestDappNFTs (5)' });
          const nftsListItemsFirstCheck = await driver.findElements(
            '.nft-item__container',
          );
          assert.equal(nftsListItemsFirstCheck.length, 5);
        },
      );
    });

    it('should prompt users to add their NFTs to their wallet (one by one) @no-mmi', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // mint NFT
          await driver.fill('#mintAmountInput', '5');
          await driver.clickElement({ text: 'Mint', tag: 'button' });

          // Notification
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Deposit',
          });

          // verify the mint transaction has finished
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const nftsMintStatus = await driver.findElement({
            css: '#nftsStatus',
            text: 'Mint completed',
          });
          assert.equal(await nftsMintStatus.isDisplayed(), true);

          // watch 3 of the nfts
          await driver.fill('#watchNFTInput', '1');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '2');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '3');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // avoid race condition
          await driver.waitForSelector({
            css: '.confirm-add-suggested-nft__nft-tokenId',
            text: '#3',
          });

          // confirm watchNFT
          await driver.waitForSelector({
            css: '.mm-text--heading-lg',
            text: 'Add suggested NFTs',
          });
          await driver.clickElement({ text: 'Add NFTs', tag: 'button' });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          // Changed this check from 3 to 6, because after mint all nfts has been added to state,
          await driver.findElement({ text: 'TestDappNFTs (6)' });
          const nftsListItemsFirstCheck = await driver.findElements(
            '.nft-item__container',
          );
          assert.equal(nftsListItemsFirstCheck.length, 6);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.fill('#watchNFTInput', '4');

          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '5');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });
          await driver.fill('#watchNFTInput', '6');
          await driver.clickElement({ text: 'Watch NFT', tag: 'button' });

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // avoid race condition
          await driver.waitForSelector({
            css: '.confirm-add-suggested-nft__nft-tokenId',
            text: '#6',
          });

          // confirm watchNFT
          await driver.waitForSelector({
            css: '.mm-text--heading-lg',
            text: 'Add suggested NFTs',
          });
          await driver.clickElement({ text: 'Add NFTs', tag: 'button' });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          await driver.findElement({ text: 'TestDappNFTs (6)' });
          const nftsListItemsSecondCheck = await driver.findElements(
            '.nft-item__container',
          );
          assert.equal(nftsListItemsSecondCheck.length, 6);
        },
      );
    });

    it('should prompt users to add their NFTs to their wallet (all at once)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // mint NFT
          await driver.fill('#mintAmountInput', '5');
          await driver.clickElement({ text: 'Mint', tag: 'button' });

          // Notification
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElementAndWaitForWindowToClose({
            text: 'Confirm',
            tag: 'button',
          });
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );

          // We need to wait until the transaction is confirmed before looking for the tx
          // otherwise the element becomes stale, as it updates from 'pending' to 'confirmed'
          await driver.waitForSelector('.transaction-status-label--confirmed');

          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Deposit',
          });
          // verify the mint transaction has finished
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await driver.waitForSelector({
            css: '#nftsStatus',
            text: 'Mint completed',
          });

          // watch all nfts
          await driver.clickElement({ text: 'Watch all NFTs', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // confirm watchNFT
          await driver.waitForSelector({
            css: '.mm-text--heading-lg',
            text: 'Add suggested NFTs',
          });

          await driver.findElements(
            '.confirm-add-suggested-nft__nft-list-item',
          );
          const suggestedNftListItems = await driver.findElements(
            '.confirm-add-suggested-nft__nft-list-item',
          );
          // there are 6 nfts to add because one is minted as part of the fixture
          assert.equal(suggestedNftListItems.length, 6);

          // remove one nft from the list
          const removeButtons = await driver.findElements(
            '.confirm-add-suggested-nft__nft-remove',
          );
          await removeButtons[0].click();

          await driver.clickElementAndWaitForWindowToClose({
            text: 'Add NFTs',
            tag: 'button',
          });

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await clickNestedButton(driver, 'NFTs');
          await driver.findElement({ text: 'TestDappNFTs (5)' });
          const nftsListItemsSecondCheck = await driver.findElements(
            '.nft-item__container',
          );

          assert.equal(nftsListItemsSecondCheck.length, 5);
        },
      );
    });

    it('should transfer a single ERC721 NFT from one account to another', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Click Transfer
          await driver.fill('#transferTokenInput', '1');
          await driver.clickElement('#transferFromButton');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Confirm transfer
          await driver.waitForSelector({
            css: 'h2',
            text: 'TestDappNFTs',
          });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.findElement({ text: 'Send TDN' });
        },
      );
    });

    it('should approve an address to transfer a single ERC721 NFT', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Click Approve
          const approveInput = await driver.findElement('#approveTokenInput');
          await approveInput.clear();
          await approveInput.sendKeys('1');
          await driver.clickElement('#approveButton');

          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Confirm approval
          await driver.clickElement({ text: 'Confirm', tag: 'button' });
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Approve TDN spending cap',
          });
        },
      );
    });

    it('should enable approval for a third party address to manage all ERC721 NFTs @no-mmi', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Enable Set approval for all
          await driver.clickElement('#setApprovalForAllButton');
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Confirm enabling set approval for all
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Approve TDN with no spend limit',
          });
        },
      );
    });

    it('should disable approval for a third party address to manage all ERC721 NFTs @no-mmi', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          smartContract,
          title: this.test.fullTitle(),
        },
        async ({ driver, _, contractRegistry }) => {
          const contract = contractRegistry.getContractAddress(smartContract);
          await unlockWallet(driver);

          // Open Dapp and wait for deployed contract
          await openDapp(driver, contract);
          await driver.findClickableElement('#deployButton');

          // Disable Set approval for all
          await driver.clickElement('#revokeButton');
          await driver.waitUntilXWindowHandles(3);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // Confirm disabling set approval for all
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await driver.clickElement(
            '[data-testid="account-overview__activity-tab"]',
          );
          await driver.waitForSelector(
            '.transaction-list__completed-transactions .transaction-list-item:nth-of-type(1)',
          );

          // Verify transaction
          await driver.waitForSelector({
            css: '[data-testid="activity-list-item-action"]',
            text: 'Approve TDN with no spend limit',
          });
        },
      );
    });
  });
});
