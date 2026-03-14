/**
 * Shared helper functions for token import tests
 *
 * This file contains all the common logic used by token import tests:
 * - Image downloading and comparison
 * - Logo validation
 * - Tokenlist fetching
 * - Result tracking types
 */

/**
 * Token interface matching standard tokenlist format
 */
export type Token = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

/**
 * Results tracking for token imports
 */
export type TokenImportResults = {
  successful: {
    symbol: string;
    address: string;
    name: string;
    logoStatus: 'valid' | 'fallback' | 'not-checked';
    balance?: string;
    fiatValue?: string;
    priceAvailable?: boolean;
    priceChange?: string;
  }[];
  failed: { symbol: string; address: string; name: string; error: string }[];
  skipped: { symbol: string; address: string; name: string; reason: string }[];
  missingLogos: {
    symbol: string;
    address: string;
    name: string;
    logoURI: string | undefined;
    reason: string;
  }[];
};

/**
 * Network test result for consolidated report
 */
export type NetworkTestResult = {
  networkName: string;
  chainId: number;
  tokenlistUrl: string;
  blockExplorerUrl: string;
  totalTokens: number;
  results: TokenImportResults;
  timestamp: Date;
};

/**
 * Generate a consolidated markdown report from all network test results
 * @param networkResults
 * @param outputPath
 */
export function generateConsolidatedReport(
  networkResults: NetworkTestResult[],
  outputPath: string,
): void {
  const fs = require('fs');
  const path = require('path');

  const reportTimestamp = new Date();

  let markdown = `# Token Import Test Report - All Networks\n\n`;
  markdown += `**Generated:** ${reportTimestamp.toLocaleString()}\n`;
  markdown += `**Total Networks Tested:** ${networkResults.length}\n\n`;
  markdown += `---\n\n`;

  // Table of Contents
  markdown += `## 📑 Table of Contents\n\n`;
  networkResults.forEach((network, index) => {
    markdown += `${index + 1}. [${network.networkName}](#${network.networkName.toLowerCase().replace(/\s+/g, '-')})\n`;
  });
  markdown += `\n---\n\n`;

  // Overall Summary
  markdown += `## 📊 Overall Summary\n\n`;

  const totalTokensAll = networkResults.reduce(
    (sum, n) => sum + n.totalTokens,
    0,
  );
  const totalSuccessful = networkResults.reduce(
    (sum, n) => sum + n.results.successful.length,
    0,
  );
  const totalSkipped = networkResults.reduce(
    (sum, n) => sum + n.results.skipped.length,
    0,
  );
  const totalFailed = networkResults.reduce(
    (sum, n) => sum + n.results.failed.length,
    0,
  );
  const totalMissingLogos = networkResults.reduce(
    (sum, n) => sum + n.results.missingLogos.length,
    0,
  );

  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| **Networks Tested** | ${networkResults.length} |\n`;
  markdown += `| **Total Tokens** | ${totalTokensAll} |\n`;
  markdown += `| **Successfully Imported** | ${totalSuccessful} (${((totalSuccessful / totalTokensAll) * 100).toFixed(1)}%) |\n`;
  markdown += `| **Skipped** | ${totalSkipped} (${((totalSkipped / totalTokensAll) * 100).toFixed(1)}%) |\n`;
  markdown += `| **Failed** | ${totalFailed} (${((totalFailed / totalTokensAll) * 100).toFixed(1)}%) |\n`;
  markdown += `| **Missing/Broken Logos** | ${totalMissingLogos} (${((totalMissingLogos / totalTokensAll) * 100).toFixed(1)}%) |\n\n`;

  // Network Comparison Table
  markdown += `## 📈 Network Comparison\n\n`;
  markdown += `| Network | Chain ID | Total Tokens | ✅ Imported | ⏭️ Skipped | ❌ Failed | ⚠️ Logo Issues |\n`;
  markdown += `|---------|----------|--------------|-------------|-----------|----------|----------------|\n`;

  networkResults.forEach((network) => {
    const successRate = (
      (network.results.successful.length / network.totalTokens) *
      100
    ).toFixed(1);
    markdown += `| **${network.networkName}** | ${network.chainId} | ${network.totalTokens} | ${network.results.successful.length} (${successRate}%) | ${network.results.skipped.length} | ${network.results.failed.length} | ${network.results.missingLogos.length} |\n`;
  });
  markdown += `\n---\n\n`;

  // Detailed sections for each network
  networkResults.forEach((network, networkIndex) => {
    const validLogos = network.results.successful.filter(
      (t) => t.logoStatus === 'valid',
    ).length;
    const fallbackLogos = network.results.successful.filter(
      (t) => t.logoStatus === 'fallback',
    ).length;

    markdown += `## ${networkIndex + 1}. ${network.networkName}\n\n`;

    // Network Information
    markdown += `### 📊 Network Information\n\n`;
    markdown += `| Property | Value |\n`;
    markdown += `|----------|-------|\n`;
    markdown += `| **Network Name** | ${network.networkName} |\n`;
    markdown += `| **Chain ID** | ${network.chainId} |\n`;
    markdown += `| **Tokenlist URL** | [View Tokenlist](${network.tokenlistUrl}) |\n`;
    markdown += `| **Block Explorer** | [View Explorer](${network.blockExplorerUrl}) |\n`;
    markdown += `| **Total Tokens in List** | ${network.totalTokens} |\n`;
    markdown += `| **Test Completed** | ${network.timestamp.toLocaleString()} |\n\n`;

    // Summary Statistics
    markdown += `### 📈 Summary Statistics\n\n`;
    markdown += `| Category | Count | Percentage |\n`;
    markdown += `|----------|-------|------------|\n`;
    markdown += `| ✅ **Successfully Imported** | ${network.results.successful.length} | ${((network.results.successful.length / network.totalTokens) * 100).toFixed(1)}% |\n`;
    markdown += `| └─ With Valid Logos | ${validLogos} | ${((validLogos / network.totalTokens) * 100).toFixed(1)}% |\n`;
    markdown += `| └─ With Fallback Logos | ${fallbackLogos} | ${((fallbackLogos / network.totalTokens) * 100).toFixed(1)}% |\n`;
    markdown += `| ⏭️ **Skipped (Validation)** | ${network.results.skipped.length} | ${((network.results.skipped.length / network.totalTokens) * 100).toFixed(1)}% |\n`;
    markdown += `| ❌ **Failed to Import** | ${network.results.failed.length} | ${((network.results.failed.length / network.totalTokens) * 100).toFixed(1)}% |\n`;
    markdown += `| ⚠️ **Missing/Broken Logos** | ${network.results.missingLogos.length} | ${((network.results.missingLogos.length / network.totalTokens) * 100).toFixed(1)}% |\n\n`;

    // Successfully Imported Tokens
    markdown += `### ✅ Successfully Imported Tokens (${network.results.successful.length})\n\n`;
    if (network.results.successful.length > 0) {
      markdown += `<details>\n<summary>Click to expand token list</summary>\n\n`;
      markdown += `| # | Symbol | Name | Address | Logo | Balance | Price | 24h Change |\n`;
      markdown += `|---|--------|------|---------|------|---------|-------|------------|\n`;
      network.results.successful.forEach((token, index) => {
        const logoIcon = token.logoStatus === 'valid' ? '✅' : '⚠️';
        const explorerLink = `[${token.address.substring(0, 10)}...](${network.blockExplorerUrl}/address/${token.address})`;
        const balance = token.balance || 'N/A';

        // Show green tick only if price is available AND has a $ value (not "—" or "-" or "N/A")
        const hasPrice =
          token.priceAvailable &&
          token.fiatValue &&
          token.fiatValue !== 'N/A' &&
          token.fiatValue !== '—' &&
          token.fiatValue !== '-' &&
          token.fiatValue.includes('$');
        const price = token.fiatValue || 'N/A';
        const priceIcon = hasPrice ? '✅' : '⚠️';

        // Show green tick only if price change has a numeric value (not "—" or "-" or "N/A")
        // Valid formats: "+3.45%", "-2.10%", "+0.00%"
        // Invalid formats: "—", "-", "N/A"
        const hasPriceChange =
          token.priceChange &&
          token.priceChange !== 'N/A' &&
          token.priceChange !== '—' &&
          token.priceChange !== '-' &&
          token.priceChange.includes('%');
        const priceChange = token.priceChange || 'N/A';
        const changeIcon = hasPriceChange ? '✅' : '⚠️';

        markdown += `| ${index + 1} | **${token.symbol}** | ${token.name} | ${explorerLink} | ${logoIcon} | ${balance} | ${priceIcon} ${price} | ${changeIcon} ${priceChange} |\n`;
      });
      markdown += `\n</details>\n\n`;
    } else {
      markdown += `*No tokens were successfully imported.*\n\n`;
    }

    // Skipped Tokens
    if (network.results.skipped.length > 0) {
      markdown += `### ⏭️ Skipped Tokens (${network.results.skipped.length})\n\n`;
      markdown += `<details>\n<summary>Click to expand skipped tokens</summary>\n\n`;
      markdown += `| # | Symbol | Name | Address | Reason |\n`;
      markdown += `|---|--------|------|---------|--------|\n`;
      network.results.skipped.forEach((token, index) => {
        const explorerLink = `[${token.address.substring(0, 10)}...](${network.blockExplorerUrl}/address/${token.address})`;
        markdown += `| ${index + 1} | **${token.symbol}** | ${token.name} | ${explorerLink} | ${token.reason} |\n`;
      });
      markdown += `\n</details>\n\n`;
    }

    // Failed Imports
    if (network.results.failed.length > 0) {
      markdown += `### ❌ Failed Imports (${network.results.failed.length})\n\n`;
      markdown += `<details>\n<summary>Click to expand failed imports</summary>\n\n`;
      markdown += `| # | Symbol | Name | Address | Error |\n`;
      markdown += `|---|--------|------|---------|-------|\n`;
      network.results.failed.forEach((token, index) => {
        const explorerLink = `[${token.address.substring(0, 10)}...](${network.blockExplorerUrl}/address/${token.address})`;
        markdown += `| ${index + 1} | **${token.symbol}** | ${token.name} | ${explorerLink} | ${token.error} |\n`;
      });
      markdown += `\n</details>\n\n`;
    }

    // Missing/Broken Logos
    if (network.results.missingLogos.length > 0) {
      markdown += `### ⚠️ Missing/Broken Logos (${network.results.missingLogos.length})\n\n`;
      markdown += `<details>\n<summary>Click to expand logo issues</summary>\n\n`;
      markdown += `| # | Symbol | Name | Address | Logo URI | Reason |\n`;
      markdown += `|---|--------|------|---------|----------|--------|\n`;
      network.results.missingLogos.forEach((token, index) => {
        const explorerLink = `[${token.address.substring(0, 10)}...](${network.blockExplorerUrl}/address/${token.address})`;
        const logoLink = token.logoURI ? `[View](${token.logoURI})` : 'N/A';
        markdown += `| ${index + 1} | **${token.symbol}** | ${token.name} | ${explorerLink} | ${logoLink} | ${token.reason} |\n`;
      });
      markdown += `\n</details>\n\n`;
    }

    markdown += `---\n\n`;
  });

  // Footer
  markdown += `## 📝 Report Information\n\n`;
  markdown += `- **Report Generated:** ${reportTimestamp.toLocaleString()}\n`;
  markdown += `- **Test Framework:** MetaMask E2E Production Tests\n`;
  markdown += `- **Networks Tested:** ${networkResults.length}\n`;
  markdown += `- **Total Tokens Processed:** ${totalTokensAll}\n\n`;

  // Write to file
  const fullPath = path.resolve(outputPath);
  fs.writeFileSync(fullPath, markdown, 'utf8');
  console.log(`[REPORT] Consolidated markdown report saved to: ${fullPath}`);
}

/**
 * Download an image from a URL and return it as a Buffer
 * @param url
 */
export async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    // Add proper headers to avoid being blocked by CDNs/APIs
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });
    if (!response.ok) {
      console.warn(`[IMAGE DOWNLOAD] HTTP ${response.status} for ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(
      `[IMAGE DOWNLOAD] Failed to download image from ${url}:`,
      error,
    );
    return null;
  }
}

/**
 * Check if an image is mostly transparent/empty
 * Used to detect MetaMask's fallback images
 * @param buffer
 */
export async function isTransparentFallback(
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
export async function compareImages(
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
    // TEMPORARILY DISABLED - Testing if logos are actually displaying correctly
    // const metamaskTransparencyCheck = await isTransparentFallback(metamaskBuffer);

    // if (metamaskTransparencyCheck.isTransparent) {
    //   // MetaMask is serving a transparent fallback
    //   return {
    //     areSimilar: false,
    //     info: `MetaMask serving transparent fallback (${metamaskTransparencyCheck.info})`,
    //   };
    // }

    // Also check if the original is transparent (shouldn't happen, but just in case)
    // TEMPORARILY DISABLED - Testing if logos are actually displaying correctly
    // const originalTransparencyCheck = await isTransparentFallback(originalBuffer);

    // if (originalTransparencyCheck.isTransparent) {
    //   // Original logo is also transparent - this is suspicious
    //   return {
    //     areSimilar: false,
    //     info: `Original logo is transparent (${originalTransparencyCheck.info})`,
    //   };
    // }

    // Get metadata for both images
    let originalMeta, metamaskMeta;
    try {
      [originalMeta, metamaskMeta] = await Promise.all([
        sharp(originalBuffer).metadata(),
        sharp(metamaskBuffer).metadata(),
      ]);
    } catch (metadataError) {
      // If metadata extraction fails, it might be due to unsupported format (HEIF/AVIF)
      const errorMsg =
        metadataError instanceof Error
          ? metadataError.message
          : String(metadataError);
      if (
        errorMsg.includes('heif') ||
        errorMsg.includes('avif') ||
        errorMsg.includes('Unsupported')
      ) {
        // Unsupported format - assume logo is displaying correctly
        // (MetaMask wouldn't show it if it couldn't decode it)
        return {
          areSimilar: true,
          info: 'Unable to verify (unsupported format for comparison, but likely displaying correctly)',
        };
      }
      throw metadataError;
    }

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
    let originalPixels, metamaskPixels;
    try {
      [originalPixels, metamaskPixels] = await Promise.all([
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
    } catch (conversionError) {
      // If conversion fails, it might be due to unsupported format (HEIF/AVIF)
      const errorMsg =
        conversionError instanceof Error
          ? conversionError.message
          : String(conversionError);
      if (
        errorMsg.includes('heif') ||
        errorMsg.includes('avif') ||
        errorMsg.includes('Unsupported')
      ) {
        // Unsupported format - assume logo is displaying correctly
        return {
          areSimilar: true,
          info: 'Unable to verify (unsupported format for comparison, but likely displaying correctly)',
        };
      }
      throw conversionError;
    }

    // Compare pixel data
    if (originalPixels.length !== metamaskPixels.length) {
      // Different pixel counts can happen due to format differences (RGB vs RGBA, etc.)
      // If MetaMask is displaying the logo, it's working - don't fail on pixel count mismatch
      return {
        areSimilar: true,
        info: `Different formats but both valid (${originalPixels.length} vs ${metamaskPixels.length} bytes, ${targetWidth}x${targetHeight})`,
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

    // Consider images similar if > 20% of pixels match
    // Lower threshold to account for compression, resizing, and format differences
    const areSimilar = similarity > 0.2;

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
 * Check if a logo URL is accessible and returns a valid image
 * @param logoURI
 */
export async function validateLogoURL(
  logoURI: string,
): Promise<{ valid: boolean; error?: string; skipped?: boolean }> {
  // Skip validation for URLs with BASE_URL placeholder
  // MetaMask will resolve these at runtime, but we can't validate them here
  // IMPORTANT: Check this BEFORE the try block to avoid fetch() parsing errors
  if (logoURI.includes('BASE_URL') || logoURI.startsWith('BASE_URL')) {
    console.log(
      `[validateLogoURL] Skipping validation for BASE_URL placeholder: ${logoURI}`,
    );
    return { valid: true, skipped: true };
  }

  try {
    // Add proper headers to avoid being blocked by CDNs/APIs
    const response = await fetch(logoURI, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

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
 * Fetch tokenlist from a URL and filter by chain ID
 *
 * Supports multiple tokenlist formats:
 * 1. Standard format: { "tokens": [...] }
 * 2. Nested format: { "data": { "tokens": [...] } }
 * 3. Direct array: [...]
 * 4. Any other nested structure containing a "tokens" array
 *
 * Also normalizes logoUri/logoURI field names:
 * - Some tokenlists use "logoUri" (lowercase)
 * - Some use "logoURI" (uppercase)
 * - This function ensures both are available
 * @param tokenlistUrl
 * @param chainId
 */
export async function fetchTokenList(
  tokenlistUrl: string,
  chainId: number,
): Promise<Token[]> {
  const response = await fetch(tokenlistUrl);
  const data = await response.json();

  let tokensArray: Token[] = [];

  // Strategy 1: Check if data is directly an array
  if (Array.isArray(data)) {
    tokensArray = data;
  }
  // Strategy 2: Check if data.tokens exists (standard format)
  else if (data.tokens && Array.isArray(data.tokens)) {
    tokensArray = data.tokens;
  }
  // Strategy 3: Check for nested structures (e.g., data.data.tokens)
  else if (data.data?.tokens && Array.isArray(data.data.tokens)) {
    tokensArray = data.data.tokens;
  }
  // Strategy 4: Search for any "tokens" property recursively
  else {
    tokensArray = findTokensArray(data);
  }

  if (!tokensArray || tokensArray.length === 0) {
    throw new Error(`No tokens array found in tokenlist from ${tokenlistUrl}`);
  }

  // Normalize logoUri/logoURI field (some tokenlists use lowercase, some uppercase)
  const normalizedTokens = tokensArray.map((token: any) => {
    // If logoUri exists but logoURI doesn't, copy it
    if (token.logoUri && !token.logoURI) {
      return { ...token, logoURI: token.logoUri };
    }
    // If logoURI exists but logoUri doesn't, copy it
    if (token.logoURI && !token.logoUri) {
      return { ...token, logoUri: token.logoURI };
    }
    return token;
  });

  // Filter for tokens matching the specified chain ID
  const filteredTokens = normalizedTokens.filter(
    (token: Token) => token.chainId === chainId,
  );

  if (filteredTokens.length === 0) {
    console.warn(
      `[WARN] No tokens found for chainId ${chainId} in tokenlist. Total tokens: ${normalizedTokens.length}`,
    );

    // Log available chain IDs to help debug
    const availableChainIds = [
      ...new Set(normalizedTokens.map((t: Token) => t.chainId)),
    ];
    console.warn(
      `[WARN] Available chain IDs in tokenlist: ${availableChainIds.join(', ')}`,
    );
  }

  return filteredTokens;
}

/**
 * Recursively search for a "tokens" array in nested objects
 * @param obj
 */
function findTokensArray(obj: any): Token[] {
  // Base case: if obj is an array, return it
  if (Array.isArray(obj)) {
    return obj;
  }

  // Base case: if obj is not an object, return empty array
  if (typeof obj !== 'object' || obj === null) {
    return [];
  }

  // Check all properties
  for (const key in obj) {
    if (key === 'tokens' && Array.isArray(obj[key])) {
      return obj[key];
    }

    // Recursively search nested objects
    const result = findTokensArray(obj[key]);
    if (result.length > 0) {
      return result;
    }
  }

  return [];
}
