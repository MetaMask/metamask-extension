/**
 * MUSD Library Exports
 *
 * This module exports all mUSD-related utilities for conversion calculations,
 * validation, transaction building, and related helper functions.
 */

// Conversion utilities
export {
  calcTokenAmount,
  convertToMusdAmount,
  convertFromMusdAmount,
  formatMusdAmount,
  parseMusdAmountToWei,
  limitToMaximumDecimalPlaces,
  hexToDecimal,
  decimalToHex,
  convertMusdClaimAmount,
  getMusdOutputAmount,
  calculateTotalFees,
  calculateNetOutput,
  convertTokenToMusd,
  formatUsdAmount,
} from './conversion-utils';

export type {
  ConvertMusdClaimParams,
  ConvertMusdClaimResult,
  GetMusdOutputParams,
  GetMusdOutputResult,
} from './conversion-utils';

// Validation utilities
export {
  validateConversionAmount,
  isValidAmountInput,
  isAmountExceedsBalance,
  isAmountBelowMinimum,
  isWildcardMatch,
  isConvertibleToken,
  filterConvertibleTokens,
  getHighestBalanceToken,
  isGeoBlocked,
  canUserAccessMusdConversion,
  isSupportedChainId,
  isSameChainConversion,
} from './validation';

export type {
  ValidationResult,
  ValidateAmountParams,
  FilterConvertibleTokensParams,
  AccessCheckResult,
} from './validation';

// Transaction utilities
export {
  getMusdTokenAddress,
  generateERC20TransferData,
  buildMusdConversionTx,
  extractMusdConversionTransferDetails,
  convertAmountToHex,
  isMusdConversionTransaction,
  isMatchingMusdConversion,
  createMusdConversionTransaction,
  replaceMusdConversionTransactionForPayToken,
} from './transaction-utils';

export type {
  PayTokenSelection,
  CreateMusdConversionTransactionParams,
  CreateMusdConversionTransactionResult,
  MusdTransferDetails,
  TransactionControllerCallbacks,
} from './transaction-utils';
