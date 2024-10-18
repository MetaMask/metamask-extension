const { strict: assert } = require('assert');
const {
  withFixtures,
  DAPP_URL,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  defaultGanacheOptions,
} = require('../../../helpers');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const FixtureBuilder = require('../../../fixture-builder');

describe('ERC1155 NFTs testdapp interaction', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;

  it('should mint ERC1155 token', async function () {
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

        // Mint
        await driver.fill('#batchMintTokenIds', '1, 2, 3');
        await driver.fill('#batchMintIdAmounts', '1, 1, 1000000000000000');
        await driver.clickElement('#batchMintButton');

        // Notification
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Confirm Mint
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
        await driver.waitForSelector({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Deposit',
        });
      },
    );
  });

  it('should batch transfers ERC1155 token', async function () {
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

        await openDapp(driver, contract);

        await driver.fill('#batchTransferTokenIds', '1, 2, 3');
        await driver.fill('#batchTransferTokenAmounts', '1, 1, 1000000000000');
        await driver.clickElement('#batchTransferFromButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Confirm Transfer
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
        await driver.waitForSelector({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Deposit',
        });
      },
    );
  });

  it('should enable approval for a third party address to manage all ERC1155 token', async function () {
    // ERC1155 is the name of the test-dapp ERC1155 contract
    const expectedMessageTitle =
      'Allow access to and transfer all of your NFTs from ERC1155?';
    const expectedDescription =
      'This allows a third party to access and transfer all of your NFTs from ERC1155 without further notice until you revoke its access.';
    const expectedWarningMessage = 'Your NFT may be at risk';
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

        // Create a set approval for all erc1155 token request in test dapp
        await openDapp(driver, contract);
        await driver.clickElement('#setApprovalForAllERC1155Button');

        // Wait for notification popup and check the displayed message
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '[data-testid="confirm-approve-title"]',
          text: expectedMessageTitle,
        });
        await driver.waitForSelector({
          css: '.confirm-approve-content h6',
          text: DAPP_URL,
        });

        await driver.waitForSelector({
          css: '.confirm-approve-content__description',
          text: expectedDescription,
        });

        // Check displayed transaction details
        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });
        const [func, params] = await driver.findElements(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        );
        assert.equal(await func.getText(), 'Function: SetApprovalForAll');
        assert.equal(await params.getText(), 'Parameters: true');

        // Check the warning message and confirm set approval for all
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        const displayedWarning = await driver.findElement(
          '.set-approval-for-all-warning__content__header',
        );
        assert.equal(await displayedWarning.getText(), expectedWarningMessage);
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // Switch to extension and check set approval for all transaction is displayed in activity tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.waitForSelector({
          css: '.transaction-list__completed-transactions',
          text: 'Approve Token with no spend limit',
        });

        // Switch back to the dapp and verify that set approval for all action completed message is displayed
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.waitForSelector({
          css: '#erc1155Status',
          text: 'Set Approval For All completed',
        });
      },
    );
  });

  it('should revoke approval for a third party address to manage all ERC1155 token', async function () {
    // ERC1155 is the name of the test-dapp ERC1155 contract
    const expectedMessageTitle =
      'Revoke permission to access and transfer all of your NFTs from ERC1155?';
    const expectedDescription =
      'This revokes the permission for a third party to access and transfer all of your NFTs from ERC1155 without further notice.';
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

        // Create a revoke approval for all erc1155 token request in test dapp
        await openDapp(driver, contract);
        await driver.clickElement('#revokeERC1155Button');

        // Wait for notification popup and check the displayed message
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: '.confirm-approve-content__title',
          text: expectedMessageTitle,
        });

        await driver.waitForSelector({
          css: '.confirm-approve-content h6',
          text: DAPP_URL,
        });

        await driver.waitForSelector({
          css: '.confirm-approve-content__description',
          text: expectedDescription,
        });

        // Check displayed transaction details
        await driver.clickElement({
          text: 'View full transaction details',
          css: '.confirm-approve-content__small-blue-text',
        });
        const [func, params] = await driver.findElements(
          '.confirm-approve-content__data .confirm-approve-content__small-text',
        );
        assert.equal(await func.getText(), 'Function: SetApprovalForAll');
        assert.equal(await params.getText(), 'Parameters: false');

        // Click on extension popup to confirm revoke approval for all
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="page-container-footer-next"]',
        );

        // Switch to extension and check revoke approval transaction is displayed in activity tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.waitForSelector({
          css: '.transaction-list__completed-transactions',
          text: 'Approve Token with no spend limit',
        });

        // Switch back to the dapp and verify that revoke approval for all message is displayed
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        const revokeApprovalStatus = await driver.findElement({
          css: '#erc1155Status',
          text: 'Revoke completed',
        });
        assert.equal(await revokeApprovalStatus.isDisplayed(), true);
      },
    );
  });
});
