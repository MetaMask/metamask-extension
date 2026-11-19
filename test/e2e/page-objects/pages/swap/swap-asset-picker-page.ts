import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

/**
 * Token search requests are debounced by 300ms, and their results rebuild the
 * list, so the loading skeleton must stay gone for longer than that before a
 * row is safe to click.
 */
const SEARCH_RESULTS_SETTLE_MS = 500;

/**
 * The full-screen asset picker the Swap screen opens to choose the source or
 * destination token.
 *
 * Screen: `#/cross-chain/swaps/prepare-bridge-page/assets`.
 * Owns: token search, the network filter, token rows (selection, disabled
 * state, result count), importing a token by contract address, the token info
 * icon that opens the asset page, and the Back button.
 * Boundaries: the picker only. Opening it and the selected tokens shown
 * afterwards belong to `SwapPage`.
 * Related: `flows/bridge.flow.ts` for steps that open the picker from the Swap
 * screen and select a token.
 *
 * @see ui/pages/bridge/asset-picker/index.tsx
 * @see test/e2e/page-objects/pages/swap/swap-page.ts
 */
class SwapAssetPickerPage {
  private readonly assetInfoIcon = (assetId: string) => ({
    tag: 'button' as const,
    testId: `bridge-asset-info-icon-${assetId}`,
  });

  private readonly assetLoadingSkeleton =
    '[data-testid="bridge-asset-loading-skeleton"]';

  private readonly backButton = '[aria-label="Back"]';

  private readonly driver: Driver;

  private readonly importTokensButton =
    '[data-testid="import-tokens-import-button"]';

  private readonly networkNameSelector = (network: string) =>
    `[data-testid="${network}"]`;

  private readonly networkSelector =
    '[data-testid="multichain-asset-picker__network"]';

  public readonly searchInput =
    '[data-testid="bridge-asset-picker-search-input"]';

  public readonly tokenButton = '[data-testid^="bridge-asset--"]';

  private readonly tokenButtonByText = (token: string) => ({
    text: token,
    css: this.tokenButton,
  });

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks that the asset picker is shown again after navigating back from an
   * asset page, then leaves it to return to the Swap screen.
   */
  async checkAssetPickerIsReopened(): Promise<void> {
    await this.driver.waitForSelector(this.searchInput);
    console.log('Asset picker is visible');
    // The Swap screen has a back button with the same label as the picker's,
    // so wait for the picker to go away instead of for the button itself.
    await this.driver.clickElement(this.backButton);
    await this.driver.assertElementNotPresent(this.searchInput);
    console.log('Asset picker closed');
  }

  /**
   * Checks that the asset picker is loaded.
   *
   * @param timeout - Optional timeout in milliseconds. Defaults to 10000.
   */
  async checkPageIsLoaded(timeout: number = 10000): Promise<void> {
    await this.driver.waitForMultipleSelectors(
      [this.searchInput, this.networkSelector],
      { timeout },
    );
    console.log('Swap asset picker is loaded');
  }

  async checkTokenIsDisabled(): Promise<void> {
    const [token] = await this.driver.findElements(this.tokenButton);
    await token.click();
    const isSelected = await token.isSelected();
    assert.equal(isSelected, false);
  }

  /**
   * Returns whether a token row is already listed, without searching.
   *
   * @param token - Token symbol shown on the row.
   */
  async isTokenListed(token: string): Promise<boolean> {
    return await this.driver.isElementPresentAndVisible(
      this.tokenButtonByText(token),
      1000,
    );
  }

  async search(searchInput: string): Promise<void> {
    console.log(`Fill asset picker search input with ${searchInput}`);
    await this.driver.pasteIntoField(this.searchInput, searchInput);
  }

  /**
   * Optionally filters to a network, searches for a token, and clicks its info
   * icon. Matches the icon for either lowercase or checksummed `assetId`
   * casing.
   *
   * Prefer filtering by `network` when the token lives on a specific chain —
   * searching under "All networks" can miss cross-chain results in CI.
   *
   * @param params - Search and click parameters.
   * @param params.token - Token symbol to type into the search field.
   * @param params.assetId - CAIP-19 asset id.
   * @param params.network - Optional network display name (e.g. 'Linea') to
   * filter the picker before searching.
   */
  async searchAndClickAssetInfo({
    token,
    assetId,
    network,
  }: {
    token: string;
    assetId: string;
    network?: string;
  }): Promise<void> {
    console.log(
      `Opening asset info icon for asset ${token}${
        network ? ` on ${network}` : ''
      }`,
    );
    if (network) {
      await this.selectNetwork(network);
    }

    await this.search(token);

    const lowercaseIcon = this.assetInfoIcon(assetId.toLowerCase());
    const checksummedIcon = this.assetInfoIcon(assetId);
    await this.driver.waitUntil(
      async () => {
        return (
          (await this.driver.isElementPresentAndVisible(lowercaseIcon, 1000)) ||
          (await this.driver.isElementPresentAndVisible(checksummedIcon, 1000))
        );
      },
      { timeout: this.driver.timeout, interval: 200 },
    );
    const useLowercase = await this.driver.isElementPresentAndVisible(
      lowercaseIcon,
      1000,
    );
    await this.driver.clickElement(
      useLowercase ? lowercaseIcon : checksummedIcon,
    );
  }

  /**
   * Searches for a token and selects it, which closes the picker.
   *
   * @param token - Token symbol to search for and select.
   * @param options - Options.
   * @param options.timeout - How long to wait for the token row.
   */
  async searchAndSelectToken(
    token: string,
    options: { timeout?: number } = {},
  ): Promise<void> {
    await this.search(token);
    await this.selectToken(token, options);
  }

  async searchAssetAndVerifyCount(
    searchInput: string,
    count: number,
  ): Promise<void> {
    await this.search(searchInput);
    await this.driver.elementCountBecomesN(this.tokenButton, count);
  }

  async selectNetwork(network: string): Promise<void> {
    await this.driver.clickElement(this.networkSelector);
    await this.driver.clickElementAndWaitToDisappear(
      this.networkNameSelector(network),
    );
  }

  /**
   * Clicks a listed token row and waits until the picker closes.
   *
   * @param token - Token symbol shown on the row.
   * @param options - Options.
   * @param options.timeout - How long to wait for the token row.
   */
  async selectToken(
    token: string,
    { timeout }: { timeout?: number } = {},
  ): Promise<void> {
    const tokenSelector = this.tokenButtonByText(token);
    await this.driver.waitForSelector(tokenSelector, { timeout });
    await this.driver.assertElementNotPresent(this.assetLoadingSkeleton, {
      waitAtLeastGuard: SEARCH_RESULTS_SETTLE_MS,
    });
    await this.driver.clickElement(tokenSelector);
    await this.driver.assertElementNotPresent(this.searchInput);
  }

  /**
   * Searches by contract address and selects the token, importing it first
   * when it is not listed.
   *
   * @param contractAddress - The token contract address.
   */
  async selectTokenByContractAddress(contractAddress: string): Promise<void> {
    await this.driver.waitForSelector(this.searchInput);
    await this.driver.fill(this.searchInput, contractAddress);

    const result = await Promise.any([
      this.driver
        .waitForSelector(this.importTokensButton)
        .then(() => 'import' as const),
      this.driver
        .waitForSelector(this.tokenButton)
        .then(() => 'asset' as const),
    ]);

    if (result === 'import') {
      await this.driver.clickElement(this.importTokensButton);
      await this.driver.waitForSelector(this.tokenButton);
    }
    await this.driver.clickElement(this.tokenButton);
  }
}

export default SwapAssetPickerPage;
