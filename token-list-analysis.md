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

1. **Size Increases**: Most chains saw significant size increases when moving from occurrenceFloor 3 to 2, indicating that many tokens with occurrence = 2 are now being included.

2. **Major Size Changes**:
   - **Base**: 470.34 KB → 749.80 KB (+59% increase)
   - **Polygon**: 322.49 KB → 621.35 KB (+93% increase)
   - **Sonic**: 3.80 KB → 70.71 KB (+1,760% increase)
   - **zkSync Era**: 21.70 KB → 49.05 KB (+126% increase)

3. **Chains with OccurrenceFloor = 1**: These chains now include tokens that appear on only 1 aggregator, making them more inclusive for newer or less established tokens.

4. **New Entries**: ApeChain now has tokens (was previously empty), and some token counts have changed significantly.

5. **Performance Impact**: The total data transferred has increased substantially, which may impact loading times and bandwidth usage.
