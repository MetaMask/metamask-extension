import { MIN_GAS_LIMIT_HEX } from '../../../../shared/constants/gas';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';

const MIN_GAS_PRICE_DEC = '0';
const MIN_GAS_PRICE_HEX = parseInt(MIN_GAS_PRICE_DEC, 10).toString(16);
const MIN_GAS_LIMIT_DEC = new Numeric('21000', 10);
const MAX_GAS_LIMIT_DEC = '30000000';

const HIGH_FEE_WARNING_MULTIPLIER = 1.5;
const MIN_GAS_PRICE_GWEI = new Numeric(
  MIN_GAS_PRICE_HEX,
  16,
  EtherDenomination.WEI,
)
  .toDenomination(EtherDenomination.GWEI)
  .round(1)
  .toPrefixedHexString();

const MIN_GAS_TOTAL = new Numeric(MIN_GAS_LIMIT_HEX, 16)
  .times(new Numeric(MIN_GAS_PRICE_HEX, 16, EtherDenomination.WEI))
  .toPrefixedHexString();

const TOKEN_TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb';
const NFT_TRANSFER_FROM_FUNCTION_SIGNATURE = '0x23b872dd';
const NFT_SAFE_TRANSFER_FROM_FUNCTION_SIGNATURE = '0xf242432a';

const INSUFFICIENT_FUNDS_ERROR = 'insufficientFunds';
const INSUFFICIENT_TOKENS_ERROR = 'insufficientTokens';
const NEGATIVE_ETH_ERROR = 'negativeETH';
const NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR = 'negativeOrZeroAmountToken';
const FLOAT_TOKENS_ERROR = 'floatAmountToken';
const INVALID_RECIPIENT_ADDRESS_ERROR = 'invalidAddressRecipient';
const REQUIRED_ERROR = 'required';
const KNOWN_RECIPIENT_ADDRESS_WARNING = 'knownAddressRecipient';
const CONTRACT_ADDRESS_ERROR = 'contractAddressError';
const CONFUSING_ENS_ERROR = 'confusingEnsDomain';
const ENS_UNKNOWN_ERROR = 'ensUnknownError';
const NO_RESOLUTION_FOR_DOMAIN = 'noDomainResolution';
const SWAPS_NO_QUOTES = 'swapQuotesNotAvailableErrorTitle';
const SWAPS_QUOTES_ERROR = 'swapFetchingQuotesErrorTitle';
const INVALID_HEX_DATA_ERROR = 'invalidHexDataError';

const RECIPIENT_TYPES = {
  SMART_CONTRACT: 'SMART_CONTRACT',
  NON_CONTRACT: 'NON_CONTRACT',
};

export {
  MAX_GAS_LIMIT_DEC,
  HIGH_FEE_WARNING_MULTIPLIER,
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_WARNING,
  CONTRACT_ADDRESS_ERROR,
  ENS_UNKNOWN_ERROR,
  MIN_GAS_LIMIT_DEC,
  MIN_GAS_PRICE_DEC,
  MIN_GAS_PRICE_GWEI,
  MIN_GAS_PRICE_HEX,
  MIN_GAS_TOTAL,
  NEGATIVE_ETH_ERROR,
  NEGATIVE_OR_ZERO_AMOUNT_TOKENS_ERROR,
  NO_RESOLUTION_FOR_DOMAIN,
  FLOAT_TOKENS_ERROR,
  REQUIRED_ERROR,
  CONFUSING_ENS_ERROR,
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
  NFT_TRANSFER_FROM_FUNCTION_SIGNATURE,
  NFT_SAFE_TRANSFER_FROM_FUNCTION_SIGNATURE,
  RECIPIENT_TYPES,
  SWAPS_NO_QUOTES,
  SWAPS_QUOTES_ERROR,
  INVALID_HEX_DATA_ERROR,
};
