import { Driver } from '../../../webdriver/driver';

/**
 * Page Object for Token Management page
 * Handles the new token import flow:
 * 1. Click Manage Tokens button
 * 2. Click Add Custom Token button
 * 3. Enter token address
 * 4. Click Submit
 * 5. Verify on Token Management page
 * 6. Navigate back to Home
 */
class TokenManagementPage {
  private readonly driver: Driver;

  private readonly assetOptionsButton =
    '[data-testid="asset-list-control-bar-action-button"]';

  private readonly manageTokensButton =
    '[data-testid="manageTokens__button"]';

  private readonly manageTokensMenuItem =
    '[data-testid="manageTokens"]';

  private readonly addCustomTokenButton =
    '[data-testid="token-management-add-custom-token-button"]';

  private readonly customTokenAddressInput =
    '#custom-token-import-address';

  private readonly submitButton =
    '[data-testid="custom-token-import-submit-button"]';

  private readonly tokenManagementPage =
    '[data-testid="token-management-page"]';

  private readonly backButton =
    '[data-testid="token-management-header-back-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Opens the Token Management page by clicking the Manage Tokens button
   * @param skipInitialClick - If true, skip the initial 3-dots click (assumes dropdown is already open)
   */
  async openTokenManagement(skipInitialClick: boolean = false): Promise<void> {
    const isTokenManagementPageAlreadyOpen =
      await this.driver.isElementPresentAndVisible(this.tokenManagementPage, 1500);
    if (isTokenManagementPageAlreadyOpen) {
      console.log('[TokenManagement] ✅ Token Management page already open');
      return;
    }

    if (skipInitialClick) {
      console.log('[TokenManagement] Skipping initial 3-dots click (dropdown already open)');
    } else {
      console.log('[TokenManagement] Clicking 3-dots button to open asset options menu...');
    }

    // Even when callers think the dropdown is open, UI transitions can close it.
    // Keep a second attempt that explicitly opens the 3-dots menu as a fallback.
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const shouldClickAssetOptions =
        !skipInitialClick || (skipInitialClick && attempt > 1);

      if (shouldClickAssetOptions) {
        await this.driver.waitForSelector(this.assetOptionsButton, {
          timeout: 10000,
        });
        await this.driver.clickElement(this.assetOptionsButton);
        await this.driver.delay(500);
      } else if (attempt === 1) {
        // On first skip attempt, only wait for the already-open dropdown to settle.
        await this.driver.delay(300);
      }

      const openedDirectly = await this.driver.isElementPresentAndVisible(
        this.tokenManagementPage,
        1000,
      );
      if (openedDirectly) {
        console.log(
          `[TokenManagement] ✅ Token Management page opened directly (attempt ${attempt})`,
        );
        return;
      }

      const hasLegacyManageTokensButton =
        await this.driver.isElementPresentAndVisible(this.manageTokensButton, 2500);
      const hasManageTokensMenuItem =
        await this.driver.isElementPresentAndVisible(this.manageTokensMenuItem, 2500);

      if (hasLegacyManageTokensButton) {
        await this.driver.clickElement(this.manageTokensButton);
        await this.driver.delay(500);
        console.log('[TokenManagement] ✅ Manage Tokens button clicked');
        return;
      }

      if (hasManageTokensMenuItem) {
        await this.driver.clickElement(this.manageTokensMenuItem);
        await this.driver.delay(500);
        console.log('[TokenManagement] ✅ Manage Tokens menu item clicked');
        return;
      }

      console.log(
        `[TokenManagement] Manage Tokens entry not found (attempt ${attempt}), retrying...`,
      );
    }

    throw new Error(
      'Manage Tokens entry was not found after retries (selectors: manageTokens__button/manageTokens)',
    );
  }

  /**
   * Clicks the Add Custom Token button
   */
  async clickAddCustomTokenButton(): Promise<void> {
    console.log('[TokenManagement] Clicking Add Custom Token button...');
    await this.driver.waitForSelector(this.addCustomTokenButton, {
      timeout: 10000,
    });
    await this.driver.clickElement(this.addCustomTokenButton);
    await this.driver.delay(500);
    console.log('[TokenManagement] ✅ Add Custom Token button clicked');
  }

  /**
   * Enters the token address in the address input field
   * @param tokenAddress - The token address to import (e.g., 0x...)
   */
  async enterTokenAddress(tokenAddress: string): Promise<void> {
    console.log(`[TokenManagement] Entering token address: ${tokenAddress}`);

    // Validate address format
    if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
      throw new Error(
        `Invalid token address format: ${tokenAddress}. Expected format: 0x followed by 40 hex characters`,
      );
    }

    await this.driver.waitForSelector(this.customTokenAddressInput, {
      timeout: 10000,
    });
    await this.driver.fill(this.customTokenAddressInput, tokenAddress);
    await this.driver.delay(500);
    console.log('[TokenManagement] ✅ Token address entered');
  }

  /**
   * Clicks the Submit button to add the token
   */
  async clickSubmit(): Promise<void> {
    console.log('[TokenManagement] Clicking Submit button...');
    await this.driver.waitForSelector(this.submitButton, {
      timeout: 10000,
    });
    await this.driver.clickElement(this.submitButton);
    await this.driver.delay(1000);
    console.log('[TokenManagement] ✅ Submit button clicked');
  }

  /**
   * Verifies that we're on the Token Management page
   */
  async verifyTokenManagementPageLoaded(): Promise<void> {
    console.log('[TokenManagement] Verifying Token Management page is loaded...');
    try {
      await this.driver.waitForSelector(this.tokenManagementPage, {
        timeout: 15000,
      });
      console.log('[TokenManagement] ✅ Token Management page is loaded');
    } catch (error) {
      throw new Error(
        `Failed to load Token Management page. Error: ${error}`,
      );
    }
  }

  /**
   * Returns to the home page by clicking the back button
   */
  async goBackToHome(): Promise<void> {
    console.log('[TokenManagement] Clicking back button to return to home page...');
    try {
      await this.driver.waitForSelector(this.backButton, {
        timeout: 10000,
      });
      await this.driver.clickElement(this.backButton);
      await this.driver.delay(1000);
      console.log('[TokenManagement] ✅ Returned to home page');
    } catch (error) {
      throw new Error(`Failed to navigate back to home page. Error: ${error}`);
    }
  }

  /**
   * Complete flow: Add a custom token and return to home
   * @param tokenAddress - The token address to import
   * @param skipInitialClick - If true, skip the initial 3-dots click
   */
  async addCustomToken(tokenAddress: string, skipInitialClick: boolean = false): Promise<void> {
    console.log(
      `[TokenManagement] Starting custom token import flow for: ${tokenAddress}`,
    );
    try {
      await this.openTokenManagement(skipInitialClick);
      await this.clickAddCustomTokenButton();
      await this.enterTokenAddress(tokenAddress);
      await this.clickSubmit();
      await this.verifyTokenManagementPageLoaded();
      console.log('[TokenManagement] ✅ Token added successfully');
    } catch (error) {
      throw new Error(
        `Failed to add custom token: ${error}`,
      );
    }
  }

  /**
   * Complete flow: Add a custom token, stay on management page
   * (Useful if you want to add multiple tokens)
   * @param tokenAddress - The token address to import
   */
  async addCustomTokenAndStay(tokenAddress: string): Promise<void> {
    console.log(
      `[TokenManagement] Starting custom token import flow (stay on page): ${tokenAddress}`,
    );
    try {
      await this.openTokenManagement();
      await this.clickAddCustomTokenButton();
      await this.enterTokenAddress(tokenAddress);
      await this.clickSubmit();
      await this.verifyTokenManagementPageLoaded();
      console.log('[TokenManagement] ✅ Token added successfully (staying on management page)');
    } catch (error) {
      throw new Error(
        `Failed to add custom token: ${error}`,
      );
    }
  }
}

export default TokenManagementPage;
