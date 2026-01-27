# Fix Summary: TransactionIcon Undefined Category Error

## Issue
Error: "The category prop passed to TransactionIcon is not supported. The prop is: undefined"

**Root Cause:** The `mapTransactionTypeToCategory` function in `helpers.ts` did not have a handler for the `TransactionType.gasPayment` transaction type, causing it to return `undefined`, which then triggered an error in the `TransactionIcon` component.

## Solution
Added support for `gas_payment` transaction type by mapping it to the `interaction` category, since gas payment transactions are a type of contract interaction used for paying gas fees with alternative tokens.

## Changes Made

### 1. Updated `ui/components/app/transaction-list-item/helpers.ts`
- Added `TransactionType.gasPayment` to the interaction category case in `mapTransactionTypeToCategory`
- Gas payment transactions now map to `TransactionGroupCategory.interaction`
- This is appropriate because gas payments involve contract interactions to pay gas with tokens

### 2. Updated `ui/components/app/transaction-list-item/helpers.test.ts`
- Added comprehensive test coverage for the `gasPayment` transaction type
- Added tests for other interaction types to ensure consistency
- Added edge case tests for unknown transaction types

## Why This Fix Works

1. **Gas payment transactions are contract interactions**: They involve interacting with contracts to pay gas fees using tokens instead of native currency
2. **The `interaction` category already exists**: The `TransactionIcon` component already has the `interaction` category mapped to `IconName.ProgrammingArrows`
3. **Defensive coding**: While gas payment transactions should be filtered out at the selector level, this provides a safety net for cases where they slip through

## Testing
- ✅ All unit tests pass
- ✅ TypeScript type checking passes
- ✅ Linting passes
- ✅ Integration with existing transaction list components verified
- ✅ Transaction icon component properly handles the new mapping

## Related Code
- Selectors already filter gas payment transactions: `ui/selectors/transactions.js`
- Transaction filtering constants: `ui/helpers/constants/transactions.js`
- Transaction icon mapping: `ui/components/app/transaction-icon/transaction-icon.js`

## Future Considerations
While this fix prevents the error, gas payment transactions should ideally never reach the UI components as they are utility transactions meant to be filtered out. The existing filtering in selectors should prevent this, but this mapping provides additional resilience.

Fixes METAMASK-XQ8E
