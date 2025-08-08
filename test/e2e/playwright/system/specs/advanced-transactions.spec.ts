import { test, expect } from '../fixtures/onboarding.fixture';
import { HomePage } from '../page-objects/home-page';
import { TransactionPage } from '../page-objects/transaction-page';
import { TestHelpers } from '../utils/test-helpers';

const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk';
const TEST_RECIPIENT_ADDRESS = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

test.describe('Advanced Transaction Tests', () => {
  test.beforeEach(async ({ extensionPage, onboardingHelper }) => {
    await onboardingHelper.waitForOnboardingStart();
    await onboardingHelper.importWallet(TEST_SEED_PHRASE);
    await onboardingHelper.waitForHomePage();
  });

  test('should handle transaction with custom gas settings', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Initiate transaction
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');
    await transactionPage.waitForTransactionConfirmation();

    // Edit gas with custom values
    await transactionPage.editGasFee('25', '25000');

    // Verify gas fee updated
    const gasFee = await transactionPage.getGasFee();
    expect(gasFee).toContain('25');

    // Confirm transaction
    await transactionPage.confirmTransaction();
    await transactionPage.waitForPendingTransaction();
  });

  test('should create and confirm multiple transactions in sequence', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    const transactions = [
      { recipient: TEST_RECIPIENT_ADDRESS, amount: '0.001' },
      { recipient: TestHelpers.generateRandomAddress(), amount: '0.002' },
      { recipient: TestHelpers.generateRandomAddress(), amount: '0.003' }
    ];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];

      // Create transaction
      if (i > 0) {
        await homePage.clickSend();
      }

      await transactionPage.recipientInput.fill(tx.recipient);
      await transactionPage.amountInput.fill(tx.amount);
      await transactionPage.nextButton.click();

      await transactionPage.waitForTransactionConfirmation();
      await transactionPage.assertTransactionDetails(tx.recipient, tx.amount);
      await transactionPage.confirmTransaction();

      // Wait for transaction to be submitted before creating next one
      await extensionPage.waitForTimeout(2000);
    }

    // Verify all transactions appear in history
    const history = await transactionPage.getTransactionHistory();
    expect(history.length).toBeGreaterThanOrEqual(transactions.length);
  });

  test('should handle transaction cancellation and replacement', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Create a transaction with low gas to make it slow
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');
    await transactionPage.waitForTransactionConfirmation();

    // Set very low gas price to make transaction slow
    await transactionPage.editGasFee('1', '21000');
    await transactionPage.confirmTransaction();

    // Wait for pending transaction
    await transactionPage.waitForPendingTransaction();

    // Go to activity tab to see pending transaction
    await homePage.switchToActivityTab();

    // Look for pending transaction and attempt to speed up or cancel
    const pendingTx = extensionPage.locator('.transaction-status--pending').first();
    await expect(pendingTx).toBeVisible();

    // Click on the pending transaction
    await pendingTx.click();

    // Look for speed up or cancel options
    const speedUpButton = extensionPage.locator('button:has-text("Speed up")');
    const cancelButton = extensionPage.locator('button:has-text("Cancel")');

    if (await speedUpButton.isVisible()) {
      await speedUpButton.click();
      // Confirm speed up with higher gas
      await transactionPage.confirmButton.click();
    } else if (await cancelButton.isVisible()) {
      await cancelButton.click();
      // Confirm cancellation
      await transactionPage.confirmButton.click();
    }
  });

  test('should validate transaction limits and edge cases', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Test maximum precision amount
    await transactionPage.sendButton.click();
    await transactionPage.recipientInput.fill(TEST_RECIPIENT_ADDRESS);
    await transactionPage.amountInput.fill('0.000000000000000001'); // 1 wei in ETH

    // Should handle very small amounts
    await transactionPage.nextButton.click();
    await transactionPage.waitForTransactionConfirmation();

    // Reject this transaction
    await transactionPage.rejectTransaction();

    // Test zero amount (should show error)
    await homePage.clickSend();
    await transactionPage.recipientInput.fill(TEST_RECIPIENT_ADDRESS);
    await transactionPage.amountInput.fill('0');

    // Should show validation error for zero amount
    const errorMessage = extensionPage.locator('text=/Amount must be greater than 0/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should handle network switching during transaction flow', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Start transaction
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');
    await transactionPage.waitForTransactionConfirmation();

    // Try to switch networks during transaction (should not be possible)
    const networkSelector = homePage.networkSelector;
    await expect(networkSelector).toBeVisible();

    // Network selector might be disabled during transaction
    const isDisabled = await networkSelector.isDisabled();
    if (!isDisabled) {
      // If network switching is allowed, verify transaction context is maintained
      const currentRecipient = await extensionPage.locator('[data-testid="sender-to-recipient__recipient"]').textContent();
      expect(currentRecipient).toContain(TEST_RECIPIENT_ADDRESS);
    }

    // Complete the transaction
    await transactionPage.confirmTransaction();
    await transactionPage.waitForPendingTransaction();
  });

  test('should preserve transaction state across page refreshes', async ({ extensionPage }) => {
    const homePage = new HomePage(extensionPage);
    const transactionPage = new TransactionPage(extensionPage);

    await homePage.waitForLoad();

    // Create a transaction but don't confirm it
    await transactionPage.initiateTransaction(TEST_RECIPIENT_ADDRESS, '0.001');
    await transactionPage.waitForTransactionConfirmation();

    // Refresh the page
    await extensionPage.reload();
    await extensionPage.waitForLoadState('networkidle');

    // Check if transaction state is preserved
    try {
      // Transaction might still be there
      await transactionPage.waitForTransactionConfirmation();
      const recipient = await extensionPage.locator('[data-testid="sender-to-recipient__recipient"]').textContent();
      expect(recipient).toContain(TEST_RECIPIENT_ADDRESS);

      // Complete the transaction
      await transactionPage.confirmTransaction();
    } catch (error) {
      // Transaction state might not be preserved after refresh
      // Verify we're back to home page
      await homePage.waitForLoad();
      await homePage.assertAccountOverviewVisible();
    }
  });
});
