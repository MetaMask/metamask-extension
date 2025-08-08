import { test, expect } from '../fixtures/onboarding.fixture';

const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk';

test.describe('MetaMask Onboarding', () => {
  test('should complete new wallet creation flow', async ({ extensionPage, onboardingHelper }) => {
    await onboardingHelper.waitForOnboardingStart();

    // Accept terms and create new wallet
    await onboardingHelper.acceptTermsAndConditions();

    // Create password
    await onboardingHelper.createPassword();

    // Complete secure wallet setup
    await onboardingHelper.completeSecureWallet();

    // Complete onboarding
    await onboardingHelper.completeOnboarding();

    // Verify we're on the home page
    await onboardingHelper.waitForHomePage();

    // Verify account overview is visible
    await expect(extensionPage.locator('[data-testid="account-overview__asset-tab"]')).toBeVisible();
  });

  test('should complete wallet import flow', async ({ extensionPage, onboardingHelper }) => {
    await onboardingHelper.waitForOnboardingStart();

    // Import existing wallet
    await onboardingHelper.importWallet(TEST_SEED_PHRASE);

    // Verify we're on the home page
    await onboardingHelper.waitForHomePage();

    // Verify account overview is visible
    await expect(extensionPage.locator('[data-testid="account-overview__asset-tab"]')).toBeVisible();
  });

  test('should skip secure wallet setup during new wallet creation', async ({ extensionPage, onboardingHelper }) => {
    await onboardingHelper.waitForOnboardingStart();

    // Accept terms and create new wallet
    await onboardingHelper.acceptTermsAndConditions();

    // Create password
    await onboardingHelper.createPassword();

    // Skip secure wallet setup
    await onboardingHelper.skipSecureWallet();

    // Complete onboarding
    await onboardingHelper.completeOnboarding();

    // Verify we're on the home page
    await onboardingHelper.waitForHomePage();

    // Verify account overview is visible
    await expect(extensionPage.locator('[data-testid="account-overview__asset-tab"]')).toBeVisible();
  });

  test('should handle invalid seed phrase during import', async ({ extensionPage, onboardingHelper }) => {
    await onboardingHelper.waitForOnboardingStart();

    // Try to import with invalid seed phrase
    await extensionPage.click('button:has-text("Import an existing wallet")');
    await extensionPage.click('button:has-text("I agree")');

    // Enter invalid seed phrase
    const invalidSeedPhrase = 'invalid seed phrase test';
    const seedWords = invalidSeedPhrase.split(' ');
    for (let i = 0; i < seedWords.length && i < 12; i++) {
      await extensionPage.fill(`[data-testid="import-srp__srp-word-${i}"]`, seedWords[i]);
    }

    // Verify error message appears
    const errorMessage = extensionPage.locator('text=/Invalid seed phrase/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should validate password requirements during creation', async ({ extensionPage, onboardingHelper }) => {
    await onboardingHelper.waitForOnboardingStart();

    // Accept terms and create new wallet
    await onboardingHelper.acceptTermsAndConditions();

    // Try weak password
    await extensionPage.fill('[data-testid="create-password-new"]', '123');
    await extensionPage.fill('[data-testid="create-password-confirm"]', '123');

    // Verify validation error
    const errorMessage = extensionPage.locator('text=/Password must be at least/i');
    await expect(errorMessage).toBeVisible();

    // Try mismatched passwords
    await extensionPage.fill('[data-testid="create-password-new"]', 'StrongPassword123!');
    await extensionPage.fill('[data-testid="create-password-confirm"]', 'DifferentPassword123!');

    // Verify mismatch error
    const mismatchError = extensionPage.locator('text=/Passwords don\'t match/i');
    await expect(mismatchError).toBeVisible();
  });
});
