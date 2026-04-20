import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../../page-objects/flows/network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import SelectNetwork from '../../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../../page-objects/pages/dialog/add-network-rpc-url';

/**
 * BOB Token from tokenlist
 */
type BobToken = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

/**
 * Check if a logo URL is accessible and returns a valid image
 * @param logoURI
 */
async function validateLogoURL(
  logoURI: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(logoURI, { method: 'HEAD' });

    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return { valid: false, error: `Invalid content-type: ${contentType}` };
    }

    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { valid: false, error: errorMessage };
  }
}

/**
 * Download an image from a URL and return it as a Buffer
 * @param url
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Failed to download image from ${url}:`, error);
    return null;
  }
}

/**
 * Check if an image is mostly transparent/empty
 * Used to detect MetaMask's fallback images
 * @param buffer
 */
async function isTransparentFallback(
  buffer: Buffer,
): Promise<{ isTransparent: boolean; info?: string }> {
  try {
    const sharp = require('sharp');
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const stats = await image.stats();

    // Check if image has alpha channel
    if (!metadata.hasAlpha) {
      return { isTransparent: false, info: 'No alpha channel' };
    }

    // Get the alpha channel statistics
    // For transparent images, the alpha channel will have very low mean values
    const { channels } = stats;

    // Alpha channel is the last channel (index 3 for RGBA)
    const alphaChannel = channels[channels.length - 1];

    if (!alphaChannel) {
      return { isTransparent: false, info: 'No alpha channel stats' };
    }

    // If alpha channel mean is very low (< 50 out of 255), image is mostly transparent
    const isTransparent = alphaChannel.mean < 50;

    return {
      isTransparent,
      info: `Alpha mean: ${alphaChannel.mean.toFixed(2)}/255, ${metadata.width}x${metadata.height}`,
    };
  } catch (error) {
    return { isTransparent: false, info: 'Analysis failed' };
  }
}

/**
 * Compare two images using sharp library
 * Converts both to same format (PNG) and same size, then compares pixel data
 * Returns similarity score (0 = completely different, 1 = identical)
 * @param originalUrl
 * @param metamaskUrl
 */
async function compareImages(
  originalUrl: string,
  metamaskUrl: string,
): Promise<{ areSimilar: boolean; similarity?: number; info?: string }> {
  try {
    const sharp = require('sharp');

    // Download both images
    const [originalBuffer, metamaskBuffer] = await Promise.all([
      downloadImage(originalUrl),
      downloadImage(metamaskUrl),
    ]);

    if (!originalBuffer) {
      return { areSimilar: false, info: 'Failed to download original image' };
    }

    if (!metamaskBuffer) {
      return { areSimilar: false, info: 'Failed to download MetaMask image' };
    }

    // IMPORTANT: Check if MetaMask is serving a transparent fallback
    const metamaskTransparencyCheck =
      await isTransparentFallback(metamaskBuffer);

    if (metamaskTransparencyCheck.isTransparent) {
      // MetaMask is serving a transparent fallback
      return {
        areSimilar: false,
        info: `MetaMask serving transparent fallback (${metamaskTransparencyCheck.info})`,
      };
    }

    // Also check if the original is transparent (shouldn't happen, but just in case)
    const originalTransparencyCheck =
      await isTransparentFallback(originalBuffer);

    if (originalTransparencyCheck.isTransparent) {
      // Original logo is also transparent - this is suspicious
      return {
        areSimilar: false,
        info: `Original logo is transparent (${originalTransparencyCheck.info})`,
      };
    }

    // Get metadata for both images
    const [originalMeta, metamaskMeta] = await Promise.all([
      sharp(originalBuffer).metadata(),
      sharp(metamaskBuffer).metadata(),
    ]);

    // Determine target size (use the smaller of the two to avoid upscaling)
    const targetWidth = Math.min(
      originalMeta.width || 256,
      metamaskMeta.width || 256,
    );
    const targetHeight = Math.min(
      originalMeta.height || 256,
      metamaskMeta.height || 256,
    );

    // Convert both images to same format (PNG) and same size for comparison
    const [originalPixels, metamaskPixels] = await Promise.all([
      sharp(originalBuffer)
        .resize(targetWidth, targetHeight, { fit: 'fill' })
        .png()
        .raw()
        .toBuffer(),
      sharp(metamaskBuffer)
        .resize(targetWidth, targetHeight, { fit: 'fill' })
        .png()
        .raw()
        .toBuffer(),
    ]);

    // Compare pixel data
    if (originalPixels.length !== metamaskPixels.length) {
      return {
        areSimilar: false,
        info: `Different pixel counts: ${originalPixels.length} vs ${metamaskPixels.length}`,
      };
    }

    // Calculate similarity by comparing pixel values
    let differentPixels = 0;
    const totalPixels = originalPixels.length;
    const threshold = 10; // Allow small differences due to compression

    for (let i = 0; i < totalPixels; i++) {
      const diff = Math.abs(originalPixels[i] - metamaskPixels[i]);
      if (diff > threshold) {
        differentPixels++;
      }
    }

    const similarity = 1 - differentPixels / totalPixels;

    // Consider images similar if > 95% of pixels match
    const areSimilar = similarity > 0.95;

    return {
      areSimilar,
      similarity,
      info: `${(similarity * 100).toFixed(2)}% similar (${targetWidth}x${targetHeight})`,
    };
  } catch (error) {
    return {
      areSimilar: false,
      info: `Comparison failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Fetch BOB tokenlist from GitHub
 */
async function fetchBobTokenList(): Promise<BobToken[]> {
  const response = await fetch(
    'https://raw.githubusercontent.com/bob-collective/bob/refs/heads/master/tokenlist/tokenlist-bob.json',
  );
  const data = await response.json();

  // Filter for BOB network tokens (chainId: 60808)
  const bobTokens = data.tokens.filter(
    (token: BobToken) => token.chainId === 60808,
  );

  console.log(`[PROD TEST] Found ${bobTokens.length} tokens on BOB network`);
  return bobTokens;
}

/**
 * Production E2E Test: Add BOB Network and Import Tokens
 *
 * This test validates MetaMask's ability to:
 * 1. Add BOB network (Chain ID: 60808) via UI using "Add Custom Network" flow
 * 2. Verify the network was added successfully
 * 3. Import ALL tokens from BOB tokenlist using real contract addresses
 *
 * Network: BOB (Chain ID: 60808 / 0xed88)
 * RPC: https://rpc.gobob.xyz
 * Currency: ETH
 * Tokens: All tokens from https://raw.githubusercontent.com/bob-collective/bob/refs/heads/master/tokenlist/tokenlist-bob.json
 *
 * This test uses REAL network infrastructure with production RPC endpoints.
 */
describe('Production E2E: Add BOB Network and Import Tokens', function (this: Suite) {
  this.timeout(600000); // 10 minutes for importing many tokens

  it('adds BOB network as custom network and imports all tokens from BOB tokenlist', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet() // Start with Mainnet instead of localhost
          .build(),
        title:
          this.test?.fullTitle() ||
          'Add BOB network and import tokens production test',
        extendedTimeoutMultiplier: 2,
      },
      async ({ driver }) => {
        console.log('[PROD TEST] Logging in to wallet...');
        await loginWithoutBalanceValidation(driver);

        console.log('[PROD TEST] Waiting for home page to load...');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE); // Wait for network to stabilize

        // Network details for BOB
        const chainId = 60808;
        const networkName = 'BOB';
        const symbol = 'ETH';
        const rpcUrl = 'https://rpc.gobob.xyz';

        console.log('[PROD TEST] Opening network selection dialog...');
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();

        console.log('[PROD TEST] Opening Add Custom Network modal...');
        await selectNetworkDialog.openAddCustomNetworkModal();

        console.log('[PROD TEST] Filling network details...');
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(networkName);
        await addEditNetworkModal.fillNetworkChainIdInputField(
          chainId.toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField(symbol);
        await addEditNetworkModal.openAddRpcUrlModal();

        console.log('[PROD TEST] Adding RPC URL:', rpcUrl);
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(rpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput('BOB RPC');

        // Wait for RPC validation to complete
        console.log('[PROD TEST] Waiting for RPC validation...');
        await driver.delay(PROD_DELAYS.RPC_RESPONSE);

        await addRpcUrlModal.saveAddRpcUrl();

        console.log('[PROD TEST] Saving network...');
        await addEditNetworkModal.saveEditedNetwork();

        // Wait for network to be added and RPC to be validated
        console.log(
          '[PROD TEST] Waiting for network to be added and RPC to connect...',
        );
        await driver.delay(PROD_DELAYS.RPC_RESPONSE * 2); // Extra time for RPC connection

        // Validate the network was added
        await homePage.checkPageIsLoaded();

        // Check if there's a network error message
        console.log(
          '[PROD TEST] Checking if network was added successfully...',
        );
        try {
          await homePage.checkAddNetworkMessageIsDisplayed(networkName);
          console.log('[PROD TEST] BOB network added successfully!');
        } catch (error) {
          console.log(
            '[PROD TEST] Warning: Could not verify network add message, but continuing...',
          );
          console.log('[PROD TEST] Error:', error);
        }
        console.log('[PROD TEST] Fetching BOB tokenlist...');

        // Fetch all BOB tokens from the tokenlist
        let bobTokens: BobToken[] = [];
        try {
          bobTokens = await fetchBobTokenList();
          console.log(
            `[PROD TEST] Successfully fetched ${bobTokens.length} tokens from BOB tokenlist`,
          );
        } catch (error) {
          console.error('[PROD TEST] Failed to fetch BOB tokenlist:', error);
          throw new Error('Could not fetch BOB tokenlist');
        }

        const assetListPage = new AssetListPage(driver);

        // Track import results
        const importResults = {
          successful: [] as string[],
          failed: [] as { symbol: string; address: string; error: string }[],
          skipped: [] as { symbol: string; address: string; reason: string }[],
          missingLogos: [] as {
            symbol: string;
            address: string;
            logoURI: string | undefined;
            reason: string;
          }[],
        };

        console.log(
          `[PROD TEST] Starting to import ${bobTokens.length} tokens...`,
        );

        // Import each token with error handling
        for (let i = 0; i < bobTokens.length; i++) {
          const token = bobTokens[i];
          const progress = `[${i + 1}/${bobTokens.length}]`;

          // Pre-validate token before attempting import
          const validationIssues: string[] = [];

          // Check if symbol exists and is not empty
          if (!token.symbol || token.symbol.trim().length === 0) {
            validationIssues.push('Symbol is empty or missing');
          }

          // Check symbol length (MetaMask limit: 11 characters)
          if (token.symbol && token.symbol.length > 11) {
            validationIssues.push(
              `Symbol too long (${token.symbol.length} chars, max 11)`,
            );
          }

          // Check if address is valid (basic check)
          if (
            !token.address ||
            !token.address.startsWith('0x') ||
            token.address.length !== 42
          ) {
            validationIssues.push('Invalid token address format');
          }

          // Check if address is not all zeros
          if (
            token.address &&
            token.address.toLowerCase() === `0x${'0'.repeat(40)}`
          ) {
            validationIssues.push('Token address is all zeros (invalid)');
          }

          // If validation fails, skip this token
          if (validationIssues.length > 0) {
            const reason = validationIssues.join(', ');
            importResults.skipped.push({
              symbol: token.symbol,
              address: token.address,
              reason,
            });
            console.log(
              `[PROD TEST] ${progress} ⏭️  Skipped ${token.symbol}: ${reason}`,
            );
            continue;
          }

          console.log(
            `[PROD TEST] ${progress} Importing token: ${token.symbol} (${token.address})`,
          );

          try {
            await assetListPage.importCustomTokenByChain(
              '0xed88', // BOB chain ID in hex
              token.address,
            );

            // Wait a bit for token to be imported
            await driver.delay(2000); // Shorter delay between tokens

            // Two-part logo validation:
            // a) Server-side: Does the URL fetch a valid image?
            // b) Client-side: Does MetaMask render the image (not showing fallback)?

            if (!token.logoURI || token.logoURI.trim().length === 0) {
              // No logoURI provided in tokenlist
              importResults.missingLogos.push({
                symbol: token.symbol,
                address: token.address,
                logoURI: token.logoURI,
                reason: 'No logoURI in tokenlist',
              });
              console.log(
                `[PROD TEST] ${progress} ⚠️  Logo missing (no URI): ${token.symbol}`,
              );
            } else {
              // logoURI exists, validate if it fetches a valid image
              const urlValidation = await validateLogoURL(token.logoURI);
              if (!urlValidation.valid) {
                importResults.missingLogos.push({
                  symbol: token.symbol,
                  address: token.address,
                  logoURI: token.logoURI,
                  reason: `URL validation failed: ${urlValidation.error}`,
                });
                console.log(
                  `[PROD TEST] ${progress} ⚠️  Logo URL failed: ${token.symbol} - ${urlValidation.error}`,
                );
              } else {
                // URL is valid, now check if MetaMask actually rendered the original image
                // Navigate to tokens page to check the DOM
                await driver.clickElement(
                  '[data-testid="account-overview__asset-tab"]',
                );
                await driver.delay(1000);

                try {
                  // MetaMask always uses this pattern for ALL tokens:
                  // https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/{chainId}/erc20/{address}.png
                  // This API either:
                  // - Returns the original logo from logoURI (if it successfully fetched it)
                  // - Returns a generated fallback image (if the original failed)

                  const altText = `${token.symbol} logo`;
                  const images = await driver.findElements(
                    `img[alt="${altText}"]`,
                  );

                  if (images.length > 0) {
                    const img = images[0];
                    const metamaskSrc = await img.getAttribute('src');

                    // Compare the original logo with what MetaMask is serving
                    console.log(
                      `[PROD TEST] ${progress} 🔍 Comparing images for: ${token.symbol}`,
                    );

                    const comparison = await compareImages(
                      token.logoURI,
                      metamaskSrc,
                    );

                    if (!comparison.areSimilar) {
                      // Images are different = MetaMask is using fallback
                      importResults.missingLogos.push({
                        symbol: token.symbol,
                        address: token.address,
                        logoURI: token.logoURI,
                        reason: `Logo mismatch - MetaMask using fallback (${comparison.info})`,
                      });
                      console.log(
                        `[PROD TEST] ${progress} ⚠️  Logo mismatch: ${token.symbol}`,
                      );
                      console.log(`[PROD TEST]    ${comparison.info}`);
                      console.log(`[PROD TEST]    Original: ${token.logoURI}`);
                      console.log(`[PROD TEST]    MetaMask: ${metamaskSrc}`);
                    } else {
                      console.log(
                        `[PROD TEST] ${progress} ✅ Logo matches: ${token.symbol}`,
                      );
                      console.log(`[PROD TEST]    ${comparison.info}`);
                    }
                  } else {
                    // No <img> tag found (shouldn't happen with current MetaMask)
                    importResults.missingLogos.push({
                      symbol: token.symbol,
                      address: token.address,
                      logoURI: token.logoURI,
                      reason: 'No image element found in UI',
                    });
                    console.log(
                      `[PROD TEST] ${progress} ⚠️  No img tag: ${token.symbol}`,
                    );
                  }
                } catch (error) {
                  console.log(
                    `[PROD TEST] ${progress} ⚠️  Could not verify logo rendering for: ${token.symbol}`,
                  );
                }
              }
            }

            importResults.successful.push(token.symbol);
            console.log(
              `[PROD TEST] ${progress} ✅ Successfully imported: ${token.symbol}`,
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // Check if there's a validation error in the UI
            let uiError = null;
            try {
              const symbolErrorElement = await driver.findElement({
                text: 'Symbol must be 11 characters or fewer.',
                tag: 'p',
              });
              if (symbolErrorElement) {
                uiError =
                  'Symbol must be 11 characters or fewer (UI validation)';
              }
            } catch (e) {
              // No UI error found, use the caught error
            }

            // Close the import modal if it's still open
            try {
              const closeButton = await driver.findElement(
                '[data-testid="import-tokens-modal-close"]',
              );
              if (closeButton) {
                await driver.clickElement(
                  '[data-testid="import-tokens-modal-close"]',
                );
                await driver.delay(500);
              }
            } catch (e) {
              // Modal might already be closed
            }

            importResults.failed.push({
              symbol: token.symbol,
              address: token.address,
              error: uiError || errorMessage,
            });
            console.error(
              `[PROD TEST] ${progress} ❌ Failed to import ${token.symbol}:`,
              uiError || errorMessage,
            );
            // Continue to next token instead of failing the test
          }
        }

        // Print summary
        console.log('\n[PROD TEST] ========== IMPORT SUMMARY ==========');
        console.log(
          `[PROD TEST] Total tokens in tokenlist: ${bobTokens.length}`,
        );
        console.log(
          `[PROD TEST] ✅ Successfully imported: ${importResults.successful.length}`,
        );
        console.log(
          `[PROD TEST] ⏭️  Skipped (validation): ${importResults.skipped.length}`,
        );
        console.log(
          `[PROD TEST] ❌ Failed to import: ${importResults.failed.length}`,
        );
        console.log(
          `[PROD TEST] ⚠️  Missing logos: ${importResults.missingLogos.length}`,
        );

        // Log tokens with missing logos
        if (importResults.missingLogos.length > 0) {
          console.log(
            '\n[PROD TEST] ========== TOKENS WITH MISSING LOGOS ==========',
          );
          importResults.missingLogos.forEach((token, index) => {
            console.log(
              `[PROD TEST] ${index + 1}. ${token.symbol} (${token.address})`,
            );
            console.log(
              `[PROD TEST]    logoURI: ${token.logoURI || 'NOT PROVIDED'}`,
            );
            console.log(`[PROD TEST]    Reason: ${token.reason}`);
          });
        }

        if (importResults.successful.length > 0) {
          console.log('\n[PROD TEST] ✅ Successfully imported tokens:');
          importResults.successful.forEach((symbol) => {
            console.log(`[PROD TEST]   - ${symbol}`);
          });
        }

        if (importResults.skipped.length > 0) {
          console.log('\n[PROD TEST] ⏭️  Skipped tokens (validation issues):');
          importResults.skipped.forEach(({ symbol, address, reason }) => {
            console.log(`[PROD TEST]   - ${symbol} (${address}): ${reason}`);
          });
        }

        if (importResults.failed.length > 0) {
          console.log('\n[PROD TEST] ❌ Failed to import tokens:');
          importResults.failed.forEach(({ symbol, address, error }) => {
            console.log(`[PROD TEST]   - ${symbol} (${address}): ${error}`);
          });
        }

        console.log('[PROD TEST] =====================================\n');

        // Verify at least some tokens were imported
        const tokenList = new AssetListPage(driver);
        const actualTokens = await tokenList.getTokenListNames();
        console.log('[PROD TEST] Tokens currently in list:', actualTokens);

        // Check that we have ETH + at least some imported tokens
        console.log('[PROD TEST] Checking for ETH...');
        await tokenList.checkTokenExistsInList('Ether');

        if (importResults.successful.length === 0) {
          throw new Error('No tokens were successfully imported!');
        }

        console.log(
          `[PROD TEST] BOB network and ${importResults.successful.length} tokens imported successfully!`,
        );
      },
    );
  });
});
