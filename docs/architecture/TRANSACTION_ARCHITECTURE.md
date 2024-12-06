# Transaction System Architecture

## Overview

The transaction system in MetaMask handles all aspects of blockchain transactions, from creation to submission. It supports multiple transaction types including ETH transfers, ERC20 token transfers, contract interactions, and EIP-1559 transactions.

## Core Components

### 1. Transaction Types

The system supports several transaction types:
```typescript
enum TransactionType {
  tokenMethodApprove,
  tokenMethodSetApprovalForAll,
  tokenMethodTransfer,
  tokenMethodTransferFrom,
  tokenMethodIncreaseAllowance,
  contractInteraction,
  simpleSend
}
```

### 2. Transaction Processing Pipeline

#### Transaction Creation
- Validates transaction parameters
- Determines transaction type
- Infers asset type and token standard
- Sets appropriate gas parameters

#### Transaction Validation
- Checks for valid parameters
- Validates EIP-1559 compliance
- Verifies contract interactions
- Ensures sufficient balances

#### Token Standards Support
- ERC20: Fungible tokens
- ERC721: Non-fungible tokens
- ERC1155: Multi-token standard
- Custom standards (e.g., USDC's FiatTokenV2)

### 3. Key Utilities

#### Transaction Type Detection
```typescript
async function determineTransactionType(
  txParams: TransactionParams,
  query: EthQuery
): Promise<InferTransactionTypeResult>
```
- Analyzes transaction parameters
- Checks contract code
- Determines appropriate transaction type
- Handles contract interactions

#### Asset Type Determination
```typescript
async function determineTransactionAssetType(
  txMeta: TransactionMeta,
  query: EthQuery,
  getTokenStandardAndDetails: GetTokenStandardAndDetails
): Promise<{
  assetType: AssetType;
  tokenStandard: TokenStandard;
}>
```
- Identifies the type of asset being transferred
- Determines token standard if applicable
- Fetches token details (decimals, symbol)

#### Transaction Data Parsing
```typescript
function parseStandardTokenTransactionData(data: string)
```
- Parses token transaction data
- Extracts method calls and parameters
- Handles different token standards

### 4. Gas Management

The system supports both:
- Legacy gas pricing (gasPrice)
- EIP-1559 gas pricing (maxFeePerGas, maxPriorityFeePerGas)

Functions for gas handling:
```typescript
function isEIP1559Transaction(transactionMeta: TransactionMeta): boolean
function isLegacyTransaction(transactionMeta: TransactionMeta): boolean
```

### 5. Security Considerations

- Parameter validation for all inputs
- Contract code verification
- Balance checks
- Gas limit validation
- Data sanitization

## Transaction Flow

1. **Transaction Initiation**
   - User or dApp initiates transaction
   - Parameters validated
   - Transaction type determined

2. **Asset Resolution**
   - Asset type determined
   - Token standard identified
   - Contract verification performed

3. **Gas Estimation**
   - Appropriate gas model selected
   - Gas limits calculated
   - Fee estimation performed

4. **User Confirmation**
   - Transaction details displayed
   - Gas fees shown
   - User approves/rejects

5. **Submission**
   - Transaction signed
   - Broadcast to network
   - Receipt monitored

## Error Handling

The system implements robust error handling for:
- Invalid parameters
- Failed contract calls
- Network issues
- Insufficient funds
- User rejections

## Development Guidelines

1. **Adding New Transaction Types**
   - Extend TransactionType enum
   - Implement type detection logic
   - Add appropriate validation
   - Update UI components

2. **Token Standard Support**
   - Implement standard interfaces
   - Add ABI definitions
   - Update parsing logic
   - Add validation rules

3. **Testing Requirements**
   - Unit tests for all utilities
   - Integration tests for flows
   - Gas estimation tests
   - Error handling tests