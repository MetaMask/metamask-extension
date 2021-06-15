import {
  conversionUtil,
  multiplyCurrencies,
} from '../../helpers/utils/conversion-util';
import { addHexPrefix } from '../../../app/scripts/lib/util';

const MIN_GAS_PRICE_DEC = '0';
const MIN_GAS_PRICE_HEX = parseInt(MIN_GAS_PRICE_DEC, 10).toString(16);
const MIN_GAS_LIMIT_DEC = '21000';
const MIN_GAS_LIMIT_HEX = parseInt(MIN_GAS_LIMIT_DEC, 10).toString(16);

const MIN_GAS_PRICE_GWEI = addHexPrefix(
  conversionUtil(MIN_GAS_PRICE_HEX, {
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    numberOfDecimals: 1,
  }),
);

const MIN_GAS_TOTAL = multiplyCurrencies(MIN_GAS_LIMIT_HEX, MIN_GAS_PRICE_HEX, {
  toNumericBase: 'hex',
  multiplicandBase: 16,
  multiplierBase: 16,
});

const TOKEN_TRANSFER_FUNCTION_SIGNATURE = '0xa9059cbb';

const INSUFFICIENT_FUNDS_ERROR = 'insufficientFunds';
const INSUFFICIENT_TOKENS_ERROR = 'insufficientTokens';
const NEGATIVE_ETH_ERROR = 'negativeETH';
const INVALID_RECIPIENT_ADDRESS_ERROR = 'invalidAddressRecipient';
const INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR =
  'invalidAddressRecipientNotEthNetwork';
const REQUIRED_ERROR = 'required';
const KNOWN_RECIPIENT_ADDRESS_WARNING = 'knownAddressRecipient';
const CONTRACT_ADDRESS_ERROR = 'contractAddressError';
const CONFUSING_ENS_ERROR = 'confusingEnsDomain';
const ENS_NO_ADDRESS_FOR_NAME = 'noAddressForName';
const ENS_NOT_FOUND_ON_NETWORK = 'ensNotFoundOnCurrentNetwork';
const ENS_NOT_SUPPORTED_ON_NETWORK = 'ensNotSupportedOnNetwork';
const ENS_ILLEGAL_CHARACTER = 'ensIllegalCharacter';
const ENS_UNKNOWN_ERROR = 'ensUnknownError';
const ENS_REGISTRATION_ERROR = 'ensRegistrationError';

export {
  INSUFFICIENT_FUNDS_ERROR,
  INSUFFICIENT_TOKENS_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
  KNOWN_RECIPIENT_ADDRESS_WARNING,
  CONTRACT_ADDRESS_ERROR,
  INVALID_RECIPIENT_ADDRESS_NOT_ETH_NETWORK_ERROR,
  ENS_NO_ADDRESS_FOR_NAME,
  ENS_NOT_FOUND_ON_NETWORK,
  ENS_NOT_SUPPORTED_ON_NETWORK,
  ENS_ILLEGAL_CHARACTER,
  ENS_UNKNOWN_ERROR,
  ENS_REGISTRATION_ERROR,
  MIN_GAS_LIMIT_DEC,
  MIN_GAS_LIMIT_HEX,
  MIN_GAS_PRICE_DEC,
  MIN_GAS_PRICE_GWEI,
  MIN_GAS_PRICE_HEX,
  MIN_GAS_TOTAL,
  NEGATIVE_ETH_ERROR,
  REQUIRED_ERROR,
  CONFUSING_ENS_ERROR,
  TOKEN_TRANSFER_FUNCTION_SIGNATURE,
};
