# Fix for ERC-1155 Decimal Display Issue in OpenSea Bids

## Problem
MetaMask was displaying incorrect WETH amounts for ERC-1155 NFT bids on OpenSea. When users placed a 0.001 WETH offer on ERC-1155 collections, the signature request showed an extremely high WETH value instead of 0.001 WETH.

## Root Cause
The `PermitSimulationValueDisplay` component (`value-display.tsx`) was applying decimal conversion to ALL token types, including NFTs (ERC-721 and ERC-1155). 

The `calcTokenAmount()` function divides the raw value by 10^decimals, which is correct for ERC-20 tokens but incorrect for NFTs:
- **ERC-20 tokens** (like WETH): Need decimal conversion (e.g., 1000000000000000 ÷ 10^18 = 0.001)
- **ERC-721 NFTs**: Don't have amounts, only tokenIds
- **ERC-1155 NFTs**: Have integer amounts that should NOT be divided (e.g., 1 means 1 item, not 0.000000000000000001)

When displaying Seaport order signatures (used by OpenSea), if an ERC-1155 consideration item had decimals incorrectly applied, it would inflate the displayed value massively.

## Solution
Modified the `PermitSimulationValueDisplay` component to:
1. Accept an `assetType` parameter to identify the token standard
2. Only apply decimal conversion (`calcTokenAmount`) for ERC-20 tokens
3. Display ERC-721 and ERC-1155 amounts as-is without decimal conversion

### Files Changed

#### 1. `value-display.tsx`
- Added `assetType` parameter to component props
- Modified fiat value calculation to only apply for ERC-20 tokens
- Modified token amount calculation to skip decimal conversion for NFTs
- Added `TokenStandard` import

#### 2. `decoded-simulation.tsx`
- Passed `assetType` prop to `TokenValueDisplay` component

#### 3. `value-display.test.tsx`
- Updated all existing tests to include `assetType="ERC20"` parameter
- Added new test cases for ERC-1155 and ERC-721 to verify amounts are displayed without decimal conversion

## Testing
Added specific test cases to verify:
- ERC-1155 amounts display as-is (e.g., 1000000000000000 displays as "1,000,000,000,000,000")
- ERC-721 amounts display as-is (e.g., 5 displays as "5")
- ERC-20 tokens continue to work correctly with decimal conversion (e.g., 4321 with 4 decimals displays as "0.432")

## Impact
- **Severity**: HIGH - Prevents potential asset loss from users signing incorrect values
- **Complexity**: LOW-MEDIUM - Frontend-only fix
- **Affected Users**: Anyone using OpenSea or similar marketplaces to bid on ERC-1155 NFTs

## Files Modified
1. `/workspace/ui/pages/confirmations/components/confirm/info/typed-sign/typed-sign-v4-simulation/value-display/value-display.tsx`
2. `/workspace/ui/pages/confirmations/components/confirm/info/typed-sign/typed-sign-v4-simulation/decoded-simulation/decoded-simulation.tsx`
3. `/workspace/ui/pages/confirmations/components/confirm/info/typed-sign/typed-sign-v4-simulation/value-display/value-display.test.tsx`

## Additional Notes
- The fix is backwards compatible - the `assetType` parameter is optional
- For Permit signatures (which are always ERC-20 or ERC-721), the existing behavior continues to work
- The main benefit is for Seaport/OpenSea order signatures which can have mixed token types
