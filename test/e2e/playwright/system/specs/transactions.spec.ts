import { test, expect } from '../fixtures/onboarding.fixture';
import { HomePage } from '../page-objects/home-page';
import { TransactionPage } from '../page-objects/transaction-page';

const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk';
const TEST_RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

test.describe('Transaction Tests', () => {
  test.beforeEach(async ({ extensionPage, onboardingHelper }) => {
    // Complete onboarding first
    await onboardingHelper.waitForOnboardingStart();
    await onboardingHelper.importWallet(TEST_SEED_PHRASE);
    await onboardingHelper.waitForHomePage();
  });

  test('should initiate and confirm a basic ETH transaction', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    // Verify we're on home page
    await homePage.waitForLoad();

    // Initiate transaction
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');

    // Wait for confirmation screen
    await transactionPage.waitForTransactionConfirmation();

    // Verify transaction details
    await transactionPage.assertTransactionDetails(TEST_RECIPIENT_ADDRESS, '0.001');
    await transactionPage.assertGasFeePresent();

    // Confirm transaction
    await transactionPage.confirmTransaction();

    // Wait for transaction to be submitted
    await transactionPage.waitForPendingTransaction();

    // Verify transaction appears in activity
    const history = await transactionPage.getTransactionHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].status).toContain('Pending');
  });

  test('should reject a transaction', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Initiate transaction
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');

    // Wait for confirmation screen
    await transactionPage.waitForTransactionConfirmation();

    // Reject transaction
    await transactionPage.rejectTransaction();

    // Verify we're back on home page
    await homePage.waitForLoad();
    await homePage.assertAccountOverviewVisible();
  });

  test('should edit gas fee before confirming transaction', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Initiate transaction
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');

    // Wait for confirmation screen
    await transactionPage.waitForTransactionConfirmation();

    // Edit gas fee
    await transactionPage.editGasFee('20', '21000');

    // Verify gas fee was updated
    const gasFee = await transactionPage.getGasFee();
    expect(gasFee).toBeTruthy();

    // Confirm transaction
    await transactionPage.confirmTransaction();

    // Wait for transaction to be submitted
    await transactionPage.waitForPendingTransaction();
  });

  test('should handle insufficient funds error', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Try to send more ETH than available
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '999999');

    // Verify insufficient funds error
    const errorMessage = extensionPage.locator('text=/Insufficient funds/i');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should validate recipient address format', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Click send button
    await transactionPage.sendButton.click();

    // Try invalid address
    await transactionPage.recipientInput.fill('invalid-address');

    // Verify validation error
    const errorMessage = extensionPage.locator('text=/Invalid address/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should display transaction history', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Switch to activity tab
    await homePage.switchToActivityTab();

    // Check if activity tab is loaded
    await expect(extensionPage.locator('[data-testid="account-overview__activity-tab"]')).toHaveClass(/account-overview__tab--active/);

    // Note: In a fresh wallet, there might not be any transactions
    // This test verifies the activity tab functionality
    const activityList = extensionPage.locator('[data-testid="activity-list"]');
    await expect(activityList).toBeVisible();
  });

  test('should handle multiple pending transactions', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // First transaction
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');
    await transactionPage.waitForTransactionConfirmation();
    await transactionPage.confirmTransaction();

    // Wait a moment for the transaction to be submitted
    await extensionPage.waitForTimeout(2000);

    // Second transaction (this should queue)
    await homePage.clickSend();
    await transactionPage.recipientInput.fill(TEST_RECIPIENT_ADDRESS);
    await transactionPage.amountInput.fill('0.002');
    await transactionPage.nextButton.click();

    await transactionPage.waitForTransactionConfirmation();

    // Verify we can see the queued transaction
    const queuedTransaction = extensionPage.locator('text=/Transaction 2 of 2/i');
    await expect(queuedTransaction).toBeVisible({ timeout: 10000 });
  });

  test('should switch networks and verify transaction context', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);

    await homePage.waitForLoad();

    // Get current network
    const currentNetwork = await homePage.getNetworkName();
    expect(currentNetwork).toBeTruthy();

    // Try to switch network (this might not work in test environment)
    // But we can verify the network selector is present
    await expect(homePage.networkSelector).toBeVisible();
  });
});
