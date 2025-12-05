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


### Ethereum token addresses returned by api but not in trustwallet repo

```
[
  "0xdbdb4d16eda451d0503b854cf79d55697f90c8df",
  "0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68",
  "0x875773784af8135ea0ef43b5a374aad105c5d39e",
  "0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6",
  "0x1559fa1b8f28238fd5d76d9f434ad86fd20d1559",
  "0x4c2e59d098df7b6cbae0848d66de2f8a4889b9c3",
  "0x4104b135dbc9609fc1a9490e61369036497660c8",
  "0xae78736cd615f374d3085123a210448e74fc6393",
  "0x856c4efb76c1d1ae02e20ceb03a2a6a08b0b8dc3",
  "0xd084944d3c05cd115c09d072b9f44ba3e0e45921",
  "0x888888888889c00c67689029d7856aac1065ec11",
  "0x28d38df637db75533bd3f71426f3410a82041544",
  "0xbdf43ecadc5cef51b7d1772f722e40596bc1788b",
  "0xbe9895146f7af43049ca1c1ae358b0541ea49704",
  "0xf203ca1769ca8e9e8fe1da9d147db68b6c919817",
  "0xb6ca7399b4f9ca56fc27cbff44f4d2e4eef1fc81",
  "0xf406f7a9046793267bc276908778b29563323996",
  "0x7ca4408137eb639570f8e647d9bd7b7e8717514a",
  "0x06f3c323f0238c72bf35011071f2b5b7f43a054c",
  "0x87d73e916d7057945c9bcd8cdd94e42a6f47f776",
  "0xffffffff2ba8f66d4e51811c5190992176930278",
  "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa",
  "0xe0ad1806fd3e7edf6ff52fdb822432e847411033",
  "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
  "0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f",
  "0x08c32b0726c5684024ea6e141c50ade9690bbdcc",
  "0xc20059e0317de91738d13af027dfc4a50781b066",
  "0xcb84d72e61e383767c4dfeb2d8ff7f4fb89abc6e",
  "0x61dbbbb552dc893ab3aad09f289f811e67cef285",
  "0x075f23b9cdfce2cc0ca466f4ee6cb4bd29d83bef",
  "0x0000000000c5dc95539589fbd24be07c6c14eca4",
  "0x946fb08103b400d1c79e07acccdef5cfd26cd374",
  "0x888888435fde8e7d4c54cab67f206e4199454c60",
  "0x7f280dac515121dcda3eac69eb4c13a52392cace",
  "0xc11b1268c1a384e55c48c2391d8d480264a3a7f4",
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
  "0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4",
  "0x42bbfa2e77757c645eeaad1655e0911a7553efbc",
  "0x62b9c7356a2dc64a1969e19c23e4f579f9810aa7",
  "0xbc6da0fe9ad5f3b0d58160288917aa56653660e9",
  "0xbaac2b4491727d78d2b78815144570b9f2fe8899",
  "0x0ec9f76202a7061eb9b3a7d6b59d36215a7e37da",
  "0x865377367054516e17014ccded1e7d814edc9ce4",
  "0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44",
  "0x19d97d8fa813ee2f51ad4b4e04ea08baf4dffc28",
  "0xa1290d69c65a6fe4df752f95823fae25cb99e5a7",
  "0xa02120696c7b8fe16c09c749e4598819b2b0e915",
  "0x3af33bef05c2dcb3c7288b77fe1c8d2aeba4d789",
  "0xfd09911130e6930bf87f2b0554c44f400bd80d3e",
  "0x374cb8c27130e2c9e04f44303f3c8351b9de61c1",
  "0x2791bfd60d232150bff86b39b7146c0eaaa2ba81",
  "0xb0b195aefa3650a6908f15cdac7d92f8a5791b0b",
  "0x9c78ee466d6cb57a4d01fd887d2b5dfb2d46288f",
  "0x7866e48c74cbfb8183cd1a929cd9b95a7a5cb4f4",
  "0xf0939011a9bb95c3b791f0cb546377ed2693a574",
  "0xbc19712feb3a26080ebf6f2f7849b417fdd792ca",
  "0x038a68ff68c393373ec894015816e33ad41bd564",
  "0xb755506531786c8ac63b756bab1ac387bacb0c04",
  "0x0ab87046fbb341d058f17cbc4c1133f25a20a52f",
  "0xaac41ec512808d64625576eddd580e7ea40ef8b2",
  "0xba3335588d9403515223f109edc4eb7269a9ab5d",
  "0x9625ce7753ace1fa1865a47aae2c5c2ce4418569",
  "0x3c8d2fce49906e11e71cb16fa0ffeb2b16c29638",
  "0x60be1e1fe41c1370adaf5d8e66f07cf1c2df2268",
  "0x35fa164735182de50811e8e2e824cfb9b6118ac2",
  "0xedf6568618a00c6f0908bf7758a16f76b6e04af9",
  "0x16cda4028e9e872a38acb903176719299beaed87",
  "0xba8a621b4a54e61c442f5ec623687e2a942225ef",
  "0x62dc4817588d53a056cbbd18231d91ffccd34b2a",
  "0xa8b12cc90abf65191532a12bb5394a714a46d358",
  "0x26607ac599266b21d13c7acf7942c7701a8b699c",
  "0x368b3a58b5f49392e5c9e4c998cb0bb966752e51",
  "0x16c52ceece2ed57dad87319d91b5e3637d50afa4",
  "0x64d91f12ece7362f91a6f8e7940cd55f05060b92",
  "0xad32a8e6220741182940c5abf610bde99e737b2d",
  "0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4",
  "0xd3fd63209fa2d55b07a0f6db36c2f43900be3094",
  "0xea7cc765ebc94c4805e3bff28d7e4ae48d06468a",
  "0x030b69280892c888670edcdcd8b69fd8026a0bf3",
  "0x19ebd191f7a24ece672ba13a302212b5ef7f35cb",
  "0x6bea7cfef803d1e3d5f7c0103f7ded065644e197",
  "0xe868084cf08f3c3db11f4b73a95473762d9463f7",
  "0x6b7774cb12ed7573a7586e7d0e62a2a563ddd3f0",
  "0x4274cd7277c7bb0806bd5fe84b9adae466a8da0a",
  "0x5f0e628b693018f639d10e4a4f59bd4d8b2b6b44",
  "0x618679df9efcd19694bb1daa8d00718eacfa2883",
  "0x0de05f6447ab4d22c8827449ee4ba2d5c288379b",
  "0x99999999999999cc837c997b882957dafdcb1af9",
  "0xf0db65d17e30a966c2ae6a21f6bba71cea6e9754",
  "0xbb51e2a15a9158ebe2b0ceb8678511e063ab7a55",
  "0xe24a3dc889621612422a64e6388927901608b91d",
  "0x86ed939b500e121c0c5f493f399084db596dad20",
  "0x8c543aed163909142695f2d2acd0d55791a9edb9",
  "0x89bd2e7e388fab44ae88bef4e1ad12b4f1e0911c",
  "0xfa1c09fc8b491b6a4d3ff53a10cad29381b3f949",
  "0xe88f8313e61a97cec1871ee37fbbe2a8bf3ed1e4",
  "0x1789e0043623282d5dcc7f213d703c6d8bafbb04",
  "0x93a2db22b7c736b341c32ff666307f4a9ed910f5",
  "0x4b4d2e899658fb59b1d518b68fe836b100ee8958",
  "0x8a9c4dfe8b9d8962b31e4e16f8321c44d48e246e",
  "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9",
  "0xdd1ad9a21ce722c151a836373babe42c868ce9a4",
  "0x55c08ca52497e2f1534b59e2917bf524d4765257",
  "0xa3931d71877c0e7a3148cb7eb4463524fec27fbd",
  "0x35e78b3982e87ecfd5b3f3265b601c046cdbe232",
  "0x677ddbd918637e5f2c79e164d402454de7da8619",
  "0xfb782396c9b20e564a64896181c7ac8d8979d5f4",
  "0x5e8422345238f34275888049021821e8e08caa1f",
  "0xab2a7b5876d707e0126b3a75ef7781c77c8877ee",
  "0x8236a87084f8b84306f72007f36f2618a5634494",
  "0xdb5c3c46e28b53a39c255aa39a411dd64e5fed9c",
  "0x39fbbabf11738317a448031930706cd3e612e1b9",
  "0x98585dfc8d9e7d48f0b1ae47ce33332cf4237d96",
  "0x01ba67aac7f75f647d94220cc98fb30fcc5105bf",
  "0x232fb065d9d24c34708eedbf03724f2e95abe768",
  "0xfb5c6815ca3ac72ce9f5006869ae67f18bf77006",
  "0x9e6be44cc1236eef7e1f197418592d363bedcd5a",
  "0x2370f9d504c7a6e775bf6e14b3f12846b594cd53",
  "0xf3dcbc6d72a4e1892f7917b7c43b74131df8480e",
  "0x6c3f90f043a72fa612cbac8115ee7e52bde6e490",
  "0x69bbc3f8787d573f1bbdd0a5f40c7ba0aee9bcc9",
  "0x0f17bc9a994b87b5225cfb6a2cd4d667adb4f20b",
  "0xdfdb7f72c1f195c5951a234e8db9806eb0635346",
  "0xc36b4311b21fc0c2ead46f1ea6ce97c9c4d98d3d",
  "0xd9c2d319cd7e6177336b0a9c93c21cb48d84fb54",
  "0x892a6f9df0147e5f079b0993f486f9aca3c87881",
  "0xac3e018457b222d93114458476f3e3416abbe38f",
  "0xdcee70654261af21c44c093c300ed3bb97b78192",
  "0xf1c9acdc66974dfb6decb12aa385b9cd01190e38",
  "0xe80c0cd204d654cebe8dd64a4857cab6be8345a3",
  "0x8947da500eb47f82df21143d0c01a29862a8c3c5",
  "0x662b67d00a13faf93254714dd601f5ed49ef2f51",
  "0x99295f1141d58a99e939f7be6bbe734916a875b8",
  "0x59d9356e565ab3a36dd77763fc0d87feaf85508c",
  "0x9695e0114e12c0d3a3636fab5a18e6b737529023",
  "0xb1f1ee126e9c96231cc3d3fad7c08b4cf873b1f1",
  "0xa487bf43cf3b10dffc97a9a744cbb7036965d3b9",
  "0xe796d6ca1ceb1b022ece5296226bf784110031cd",
  "0x14da7b27b2e0fedefe0a664118b0c9bc68e2e9af",
  "0x43a96962254855f16b925556f9e97be436a43448",
  "0x675bbc7514013e2073db7a919f6e4cbef576de37",
  "0x4f640f2529ee0cf119a2881485845fa8e61a782a",
  "0xe7f58a92476056627f9fdb92286778abd83b285f",
  "0x470ebf5f030ed85fc1ed4c2d36b9dd02e77cf1b7",
  "0xf1376bcef0f78459c0ed0ba5ddce976f1ddf51f4",
  "0x4f604735c1cf31399c6e711d5962b2b3e0225ad3",
  "0xe60779cc1b2c1d0580611c526a8df0e3f870ec48",
  "0x3ebb4a4e91ad83be51f8d596533818b246f4bee1",
  "0xed1167b6dc64e8a366db86f2e952a482d0981ebd",
  "0xa35b1b31ce002fbf2058d22f30f95d405200a15b",
  "0xe1b4d34e8754600962cd944b535180bd758e6c2e",
  "0xe6828d65bf5023ae1851d90d8783cc821ba7eee1",
  "0xf99d58e463a2e07e5692127302c20a191861b4d6",
  "0xb1191f691a355b43542bea9b8847bc73e7abb137",
  "0x515d7e9d75e2b76db60f8a051cd890eba23286bc",
  "0x7697b462a7c4ff5f8b55bdbc2f4076c2af9cf51a",
  "0x1f3f9d3068568f8040775be2e8c03c103c61f3af",
  "0x385d65ed9241e415cfc689c3e0bcf5ab2f0505c2",
  "0x8c1bed5b9a0928467c9b1341da1d7bd5e10b6549",
  "0x5bc25f649fc4e26069ddf4cf4010f9f706c23831",
  "0x3aada3e213abf8529606924d8d1c55cbdc70bf74",
  "0x3ba925fdeae6b46d0bb4d424d829982cb2f7309e",
  "0xe9b076b476d8865cdf79d1cf7df420ee397a7f75",
  "0x53c8395465a84955c95159814461466053dedede",
  "0x056c1d42fb1326f57da7f19ebb7dda4673f1ff55",
  "0x177ba0cac51bfc7ea24bad39d81dcefd59d74faa",
  "0x9f52c8ecbee10e00d9faaac5ee9ba0ff6550f511",
  "0x505b5eda5e25a67e1c24a2bf1a527ed9eb88bf04",
  "0xa41f142b6eb2b164f8164cae0716892ce02f311f",
  "0x8aec4bbdcfb451aa289bfbd3c2f4e34a44ada1be",
  ....
]
```
