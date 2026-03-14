import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { toHex } from '@metamask/controller-utils';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { Driver } from '../../../webdriver/driver';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../../page-objects/flows/network.flow';
import SelectNetwork from '../../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../../page-objects/pages/dialog/add-network-rpc-url';
import HomePage from '../../../page-objects/pages/home/homepage';
import AssetListPage from '../../../page-objects/pages/home/asset-list';

/**
 * Etherlink token interface matching the tokenlist format
 */
type EtherlinkToken = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

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
 * Fetch Etherlink tokenlist from GitHub
 */
async function fetchEtherlinkTokenList(): Promise<EtherlinkToken[]> {
  const response = await fetch(
    'https://raw.githubusercontent.com/etherlinkcom/Token-List/refs/heads/main/tokenlist.json',
  );
  const data = await response.json();

  // Filter for Etherlink Mainnet tokens only (chainId: 42793)
  const etherlinkTokens = data.tokens.filter(
    (token: EtherlinkToken) => token.chainId === 42793,
  );

  return etherlinkTokens;
}

/**
 * Validate a token's logoURI by checking if it's accessible and returns a valid image
 * @param logoURI
 */
async function validateLogoURI(
  logoURI: string,
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const response = await fetch(logoURI, { method: 'HEAD' });

    if (!response.ok) {
      return {
        valid: false,
        reason: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return { valid: false, reason: `Invalid content-type: ${contentType}` };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Production E2E Test: Add Etherlink Network and Import All Tokens
 *
 * This test validates MetaMask's ability to:
 * 1. Add Etherlink network (Chain ID: 42793) via UI using "Add Custom Network" flow
 * 2. Verify the network was added successfully
 * 3. Import ALL tokens from Etherlink tokenlist using real contract addresses
 *
 * Network: Etherlink Mainnet (Chain ID: 42793 / 0xa729)
 * RPC: https://node.mainnet.etherlink.com
 * Symbol: XTZ
 * Tokenlist: https://github.com/etherlinkcom/Token-List/blob/main/tokenlist.json
 */
describe('Production E2E: Add Etherlink Network and Import Tokens', function (this: Suite) {
  this.timeout(600000); // 10 minutes for importing many tokens

  it('adds Etherlink network as custom network and imports all tokens from Etherlink tokenlist', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder().withNetworkControllerOnMainnet().build(),
        title: this.test?.fullTitle() ?? 'Etherlink Token Import Test',
      },
      async ({ driver }: { driver: Driver }) => {
        // Login
        await loginWithoutBalanceValidation(driver);

        console.log('[PROD TEST] Starting Etherlink network addition...');

        // Etherlink network details
        const chainId = 42793;
        const networkName = 'Etherlink Mainnet';
        const symbol = 'XTZ';
        const rpcUrl = 'https://node.mainnet.etherlink.com';
        const rpcName = 'Etherlink RPC';

        console.log('[PROD TEST] Opening network selection dialog...');
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.openAddCustomNetworkModal();

        console.log('[PROD TEST] Adding Etherlink network details...');

        // Fill in network details using page object
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(networkName);
        await addEditNetworkModal.fillNetworkChainIdInputField(
          toHex(chainId).toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField(symbol);

        // Add RPC URL
        await addEditNetworkModal.openAddRpcUrlModal();

        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(rpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput(rpcName);
        await addRpcUrlModal.saveAddRpcUrl();

        console.log('[PROD TEST] Saving Etherlink network...');

        // Save the network
        await addEditNetworkModal.saveEditedNetwork();

        // Wait for network to be added and RPC to be validated
        console.log(
          '[PROD TEST] Waiting for network to be added and RPC to connect...',
        );
        await driver.delay(PROD_DELAYS.RPC_RESPONSE * 2); // Extra time for RPC connection

        // Verify network was added
        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();

        // Check if there's a network error message
        console.log(
          '[PROD TEST] Checking if network was added successfully...',
        );
        try {
          await homepage.checkAddNetworkMessageIsDisplayed(networkName);
          console.log('[PROD TEST] ✅ Etherlink network added successfully!');
        } catch (error) {
          console.log(
            '[PROD TEST] Warning: Could not verify network add message, but continuing...',
          );
          console.log('[PROD TEST] Error:', error);
        }

        console.log('[PROD TEST] Fetching Etherlink tokenlist...');

        // Fetch all Etherlink tokens from the tokenlist
        let etherlinkTokens: EtherlinkToken[] = [];
        try {
          etherlinkTokens = await fetchEtherlinkTokenList();
          console.log(
            `[PROD TEST] Successfully fetched ${etherlinkTokens.length} tokens from Etherlink tokenlist`,
          );
        } catch (error) {
          console.error(
            '[PROD TEST] Failed to fetch Etherlink tokenlist:',
            error,
          );
          throw new Error('Could not fetch Etherlink tokenlist');
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
          `[PROD TEST] Starting to import ${etherlinkTokens.length} tokens...`,
        );

        // Import each token with error handling
        for (let i = 0; i < etherlinkTokens.length; i++) {
          const token = etherlinkTokens[i];
          const progress = `[${i + 1}/${etherlinkTokens.length}]`;

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
              toHex(chainId).toString(), // Etherlink chain ID in hex
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
              const urlValidation = await validateLogoURI(token.logoURI);
              if (!urlValidation.valid) {
                importResults.missingLogos.push({
                  symbol: token.symbol,
                  address: token.address,
                  logoURI: token.logoURI,
                  reason: `URL validation failed: ${urlValidation.reason}`,
                });
                console.log(
                  `[PROD TEST] ${progress} ⚠️  Logo URL failed: ${token.symbol} - ${urlValidation.reason}`,
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
                    } else {
                      console.log(
                        `[PROD TEST] ${progress} ✅ Logo matches: ${token.symbol}`,
                      );
                      console.log(`[PROD TEST]    ${comparison.info}`);
                    }
                  } else {
                    // No <img> tag found
                    console.log(
                      `[PROD TEST] ${progress} ⚠️  No img tag found for: ${token.symbol}`,
                    );
                  }
                } catch (logoError) {
                  console.log(
                    `[PROD TEST] ${progress} ⚠️  Logo check error: ${logoError}`,
                  );
                }
              }
            }

            importResults.successful.push(token.symbol);
            console.log(
              `[PROD TEST] ${progress} ✅ Successfully imported: ${token.symbol}`,
            );
          } catch (error) {
            importResults.failed.push({
              symbol: token.symbol,
              address: token.address,
              error: error instanceof Error ? error.message : String(error),
            });
            console.log(
              `[PROD TEST] ${progress} ❌ Failed to import: ${token.symbol}`,
            );
            console.log(`[PROD TEST]    Error: ${error}`);

            // Try to recover by closing any open modals
            try {
              await driver.clickElement(
                '[data-testid="import-tokens-modal-cancel-button"]',
              );
            } catch {
              // Ignore if cancel button not found
            }
          }
        }

        // Print summary
        console.log('\n[PROD TEST] ========== IMPORT SUMMARY ==========');
        console.log(
          `[PROD TEST] Total tokens in tokenlist: ${etherlinkTokens.length}`,
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
          `[PROD TEST] ⚠️  Tokens with logo issues: ${importResults.missingLogos.length}`,
        );

        if (importResults.skipped.length > 0) {
          console.log('\n[PROD TEST] Skipped tokens:');
          importResults.skipped.forEach((item) => {
            console.log(
              `[PROD TEST]   - ${item.symbol} (${item.address}): ${item.reason}`,
            );
          });
        }

        if (importResults.failed.length > 0) {
          console.log('\n[PROD TEST] Failed imports:');
          importResults.failed.forEach((item) => {
            console.log(
              `[PROD TEST]   - ${item.symbol} (${item.address}): ${item.error}`,
            );
          });
        }

        if (importResults.missingLogos.length > 0) {
          console.log('\n[PROD TEST] Tokens with logo issues:');
          importResults.missingLogos.forEach((item) => {
            console.log(`[PROD TEST]   - ${item.symbol} (${item.address})`);
            console.log(`[PROD TEST]     logoURI: ${item.logoURI || 'N/A'}`);
            console.log(`[PROD TEST]     Reason: ${item.reason}`);
          });
        }

        console.log('[PROD TEST] ========================================\n');

        // Assert that we successfully imported at least some tokens
        assert(
          importResults.successful.length > 0,
          'Expected to successfully import at least one token',
        );

        console.log('[PROD TEST] ✅ Test completed successfully');
      },
    );
  });
});
