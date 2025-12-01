# Token List Analysis - MetaMask Extension

## Original Token List Data (Before Occurrence Floor Updates)

This table shows the original token list sizes with the old occurrence floor logic (Linea = 1, all others = 3):

| Chain Name | Chain ID | Size (MB) | Size (KB) | Original OccurrenceFloor |
|------------|----------|-----------|-----------|-------------------------|
| Ethereum Mainnet | 0x1 | 1.36 | 1,391.83 | 3 |
| Linea | 0xe708 | 0.05 | 46.32 | 1 |
| Base | 0x2105 | 0.46 | 470.34 | 3 |
| Arbitrum One | 0xa4b1 | 0.22 | 221.12 | 3 |
| BNB Smart Chain | 0x38 | 1.27 | 1,302.30 | 3 |
| Optimism | 0xa | 0.09 | 94.52 | 3 |
| Polygon | 0x89 | 0.31 | 322.49 | 3 |
| Sei | 0x531 | 0.03 | 34.64 | 3 |
| Avalanche | 0xa86a | 0.13 | 137.50 | 3 |
| Monad | 0x8f | 0.01 | 10.31 | 3 |
| zkSync Era | 0x144 | 0.02 | 21.70 | 3 |
| Berachain | 0x138de | 0.01 | 15.15 | 3 |
| Fantom | 0xfa | 0.06 | 62.46 | 3 |
| Celo | 0xa4ec | 0.02 | 18.09 | 3 |
| Scroll Alpha | 0x82750 | 0.01 | 9.19 | 3 |
| Polygon zkEVM | 0x44d | 0.00 | 3.09 | 3 |
| Sonic | 0x92 | 0.00 | 3.80 | 3 |
| Plume | 0x18232 | 0.01 | 13.21 | 3 |
| Lens | 0xe8 | 0.00 | 1.19 | 3 |
| ApeChain | 0x8173 | 0.00 | 0.00 | 3 |

## Updated Token List Data (After Occurrence Floor Logic Implementation)

This table shows the token list sizes after implementing the new occurrence floor logic:

| Chain Name | Chain ID | Size (MB) | Size (KB) | New OccurrenceFloor | Change from Original |
|------------|----------|-----------|-----------|--------------------|--------------------|
| Ethereum Mainnet | 0x1 | 1.43 | 1,464.12 | 2 | ↑ Size increased |
| Linea | 0xe708 | 0.04 | 46.01 | 1 | ≈ Similar size |
| Base | 0x2105 | 0.73 | 749.80 | 2 | ↑ Size increased significantly |
| Arbitrum One | 0xa4b1 | 0.39 | 397.33 | 2 | ↑ Size increased |
| BNB Smart Chain | 0x38 | 1.68 | 1,717.71 | 2 | ↑ Size increased |
| Optimism | 0xa | 0.14 | 145.92 | 2 | ↑ Size increased |
| Polygon | 0x89 | 0.61 | 621.35 | 2 | ↑ Size increased significantly |
| Sei | 0x531 | 0.03 | 34.64 | 1 | ≈ Similar size |
| Avalanche | 0xa86a | 0.23 | 236.91 | 2 | ↑ Size increased |
| Monad | 0x8f | 0.01 | 11.20 | 3 | ≈ Similar size |
| zkSync Era | 0x144 | 0.05 | 49.05 | 2 | ↑ Size increased significantly |
| Berachain | 0x138de | 0.08 | 80.33 | 1 | ↑ Size increased significantly |
| Fantom | 0xfa | 0.11 | 107.63 | 2 | ↑ Size increased |
| Celo | 0xa4ec | 0.03 | 29.87 | 2 | ↑ Size increased |
| Scroll Alpha | 0x82750 | 0.02 | 21.59 | 2 | ↑ Size increased |
| Polygon zkEVM | 0x44d | 0.01 | 6.27 | 2 | ↑ Size increased |
| Sonic | 0x92 | 0.07 | 70.71 | 1 | ↑ Size increased significantly |
| Plume | 0x18232 | 0.01 | 13.21 | 1 | ≈ Similar size |
| Lens | 0xe8 | 0.00 | 1.19 | 1 | ≈ Similar size |
| ApeChain | 0x8173 | 0.01 | 6.91 | 1 | ↑ Size increased (was empty) |

## Key Observations

1. **Size Increases**: Most chains saw significant size increases when moving from occurrenceFloor 3 to 2.

2. **Major Size Changes**:
   - **Base**: 470.34 KB → 749.80 KB (+59% increase)
   - **Polygon**: 322.49 KB → 621.35 KB (+93% increase)
   - **Sonic**: 3.80 KB → 70.71 KB (+1,760% increase)
   - **zkSync Era**: 21.70 KB → 49.05 KB (+126% increase)

3. **Chains with OccurrenceFloor = 1**: These chains now include tokens that appear on only 1 aggregator, making them more inclusive for newer or less established tokens.

4. **New Entries**: ApeChain now has tokens (was previously empty)

5. **Performance Impact**: The total data transferred has increased substantially, which may impact loading times and bandwidth usage.
(This issue is currently being discussed/impl in early stages with mobile team)

## Trusted Asset Filtering Analysis

### Approach Implementation

To address security concerns with the increased token list sizes after loosening occurrence floor requirements, we implemented a trusted asset filtering mechanism that validates tokens against the Trust Wallet Assets repository:

**Method**: Before adding tokens to the final tokenList, each token address is verified against Trust Wallet's public GitHub repository by making HTTP requests to `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/[chain]/assets/[tokenAddress]/info.json`. Only tokens that have corresponding asset entries in the Trust Wallet repository are included in the final token list.

**Chain Coverage**: Filtering was implemented **only for the specific chains** analyzed in this document, not all possible blockchain networks:
- Ethereum (0x1), Linea (0xe708), Base (0x2105), Arbitrum (0xa4b1)
- BNB Smart Chain (0x38), Optimism (0xa), Polygon (0x89), Sei (0x531)
- Avalanche (0xa86a), Monad (0x8f), zkSync Era (0x144), Fantom (0xfa)
- Celo (0xa4ec), Scroll Alpha (0x82750), Polygon zkEVM (0x44d), Sonic (0x92)

**Note**: Other blockchain networks supported by MetaMask that are not listed above will continue to use the original token filtering behavior without trusted asset validation.

## Technical Implementation

### Chain ID to Blockchain Folder Mapping

The implementation uses a mapping to associate hex chain IDs with their corresponding blockchain folder names in the `/blockchains/` directory:

```javascript
const CHAIN_ID_TO_BLOCKCHAIN_FOLDER = {
    '0x1': 'ethereum',           // Ethereum Mainnet
    '0xe708': 'linea',           // Linea
    '0x2105': 'base',            // Base
    '0xa4b1': 'arbitrum',        // Arbitrum One
    '0x38': 'smartchain',        // BNB Smart Chain
    '0xa': 'optimism',           // Optimism
    '0x89': 'polygon',           // Polygon
    '0x531': 'sei',              // Sei
    '0xa86a': 'avalanchec',      // Avalanche
    '0x8f': 'monad',             // Monad
    '0x144': 'zksync',           // zkSync Era
    '0xfa': 'fantom',            // Fantom
    '0xa4ec': 'celo',            // Celo
    '0x82750': 'scroll',         // Scroll Alpha
    '0x44d': 'polygonzkevm',     // Polygon zkEVM
    '0x92': 'sonic',             // Sonic
};
```

### Trusted Asset Validation Function

The core filtering logic is implemented in the `isTokenTrusted` function that validates against Trust Wallet's GitHub repository:

```javascript
async function isTokenTrusted(tokenAddress, blockchainFolderName) {
    if (!blockchainFolderName) {
        return false; // Exclude all tokens for unsupported chains (security-first approach)
    }

    try {
        // Convert token address to checksum format to match folder naming convention
        const checksumAddress = (0, controller_utils_1.toChecksumHexAddress)(tokenAddress);

        // Check if the asset exists in Trust Wallet's GitHub repository
        const assetUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${blockchainFolderName}/assets/${checksumAddress}/info.json`;

        try {
            const response = await fetch(assetUrl);
            const exists = response.ok;
            if (exists) {
                trustedAssetLookupCounter++;
            }
            return exists;
        } catch (fetchError) {
            // If fetch fails (network error, etc.), return false for security
            return false;
        }
    } catch (error) {
        console.warn(`Error checking trusted asset for ${tokenAddress} on ${blockchainFolderName}:`, error);
        return false; // Default to excluding the token if there's an error (security-first approach)
    }
}
```

### Token List Processing Logic

The filtering is integrated into the `fetchTokenList` method in `TokenListController.cjs` with async validation:

```javascript
// Get the blockchain folder name for trusted asset filtering
const blockchainFolderName = CHAIN_ID_TO_BLOCKCHAIN_FOLDER[chainId];

// Format tokens from API (HTTP) and update tokenList with trusted asset filtering
const tokenList = {};
let originalTokenCount = tokensFromAPI.length;
let filteredTokenCount = 0;
let trustedTokenCount = 0;

for (const token of tokensFromAPI) {
    // Check if this chain should have trusted asset filtering
    if (blockchainFolderName && CHAIN_ID_TO_BLOCKCHAIN_FOLDER[chainId]) {
        if (await isTokenTrusted(token.address, blockchainFolderName)) {
            trustedTokenCount++;
            tokenList[token.address] = {
                ...token,
                aggregators: (0, assetsUtil_1.formatAggregatorNames)(token.aggregators),
                iconUrl: (0, assetsUtil_1.formatIconUrlWithProxy)({
                    chainId,
                    tokenAddress: token.address,
                }),
            };
        } else {
            filteredTokenCount++;
        }
    } else {
        // No filtering for unsupported chains - include all tokens
        tokenList[token.address] = {
            ...token,
            aggregators: (0, assetsUtil_1.formatAggregatorNames)(token.aggregators),
            iconUrl: (0, assetsUtil_1.formatIconUrlWithProxy)({
                chainId,
                tokenAddress: token.address,
            }),
        };
    }
}

// Log filtering results with size calculations
if (blockchainFolderName && CHAIN_ID_TO_BLOCKCHAIN_FOLDER[chainId]) {
    const tokenListString = JSON.stringify(tokenList);
    const sizeInBytes = new Blob([tokenListString]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    console.log(`=====Token filtering results for ${chainId} (${blockchainFolderName})=====`);
    console.log(`=====Original tokens from API: ${originalTokenCount}`);
    console.log(`=====Trusted tokens (kept): ${trustedTokenCount}`);
    console.log(`=====Filtered out (not in trusted assets): ${filteredTokenCount}`);
    console.log(`=====Filtering rate: ${((filteredTokenCount / originalTokenCount) * 100).toFixed(1)}%`);
    console.log(`=====Size in bytes: ${sizeInBytes}`);
    console.log(`=====Size in KB: ${sizeInKB}`);
    console.log(`=====Size in MB: ${sizeInMB}`);
}
```

### Filtering Results

| Chain Name | Chain ID | API Tokens | Trusted Tokens | Filtered Out | Filtering Rate | Final Size (KB) |
|------------|----------|------------|----------------|--------------|----------------|----------------|
| BNB Smart Chain | 0x38 | 5,238 | 1,526 | 3,712 | 70.9% | 513.04 |
| Ethereum Mainnet | 0x1 | 4,834 | 1,656 | 3,178 | 65.7% | 563.53 |
| Base | 0x2105 | 2,346 | 211 | 2,135 | 91.0% | 71.11 |
| Polygon | 0x89 | 1,900 | 174 | 1,726 | 90.8% | 59.49 |
| Arbitrum One | 0xa4b1 | 1,200 | 166 | 1,034 | 86.2% | 56.64 |
| Avalanche | 0xa86a | 719 | 76 | 643 | 89.4% | 26.24 |
| Optimism | 0xa | 441 | 58 | 383 | 86.8% | 20.14 |
| Fantom | 0xfa | 341 | 51 | 290 | 85.0% | 16.59 |
| Sonic | 0x92 | 228 | 32 | 196 | 86.0% | 10.20 |
| zkSync Era | 0x144 | 156 | 9 | 147 | 94.2% | 2.89 |
| Linea | 0xe708 | 139 | 10 | 129 | 92.8% | 3.54 |
| Sei | 0x531 | 114 | 0 | 114 | 100.0% | 0.00 |
| Celo | 0xa4ec | 94 | 16 | 78 | 83.0% | 5.23 |
| Scroll Alpha | 0x82750 | 66 | 9 | 57 | 86.4% | 3.11 |
| Monad | 0x8f | 37 | 28 | 9 | 24.3% | 8.54 |
| Polygon zkEVM | 0x44d | 19 | 5 | 14 | 73.7% | 1.72 |

### Key Findings

1. **Effective Security Filtering**: The Trust Wallet repository validation successfully filters out 65.7% to 100% of tokens from the MetaMask API across different chains, demonstrating that the two systems use different inclusion criteria and approaches to token curation.

2. **Significant Size Reduction**: Token list sizes are dramatically reduced after filtering, with some chains like zkSync Era and Linea seeing 90%+ reductions in final payload size.

3. **Chain-Specific Patterns**:
   - **High Filtering Chains**: Sei (100%), zkSync Era (94.2%), Linea (92.8%), and Base (91.0%) show very restrictive filtering
   - **Moderate Filtering**: Ethereum (65.7%) and BNB Smart Chain (70.9%) have more established token ecosystems in Trust Wallet
   - **Low Filtering**: Monad (24.3%) shows the most permissive filtering, likely due to a smaller, more curated token set


### Conclusion

**Security Validation**: The Trust Wallet repository-based filtering demonstrates robust security controls, filtering out 65.7% to 100% of tokens from the MetaMask API across different chains. This indicates that the MetaMask Token Service API and Trust Wallet repository use different inclusion criteria and logic for surfacing tokens - the MetaMask API appears to be more inclusive for token discovery while Trust Wallet maintains a more conservative approach to asset listings.

**Risk Assessment**: The occurrence floor changes from 3→2 (and 1 for specific chains) combined with the conservative Trust Wallet filtering approach ensures that only tokens meeting Trust Wallet's stricter criteria are exposed to users, with final token lists reduced to 24.3%-100% of their original API size.

**User Experience Trade-off**: While the high filtering rates (65.7%-100%) provide essential security benefits, they also introduce a potential risk of reduced token discoverability. Users may not see legitimate tokens that haven't yet been added to Trust Wallet's repository, potentially limiting their access to emerging DeFi projects and recently launched tokens.


**Performance Benefits**: Final token list sizes are significantly smaller than unfiltered lists, improving load times and reducing bandwidth usage while maintaining security standards.


(This analysis covers the chains listed in the table above; extending the filtering to additional chains may yield different results)
