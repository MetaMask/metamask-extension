// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';

import {
  isBtcMainnetAddress,
  isSolanaAddress,
} from '../../../../shared/lib/multichain/accounts';
import { getTokenStandardAndDetailsByChain } from '../../../store/actions';
import { RecipientValidationResult } from '../types/send';

export const findConfusablesInRecipient = (
  address: string,
): RecipientValidationResult => {
  const confusableCollection = confusables(address) as {
    point: string;
    similarTo: string;
  }[];

  // First filter out duplicate points, then filter by similarTo
  const uniquePoints = new Set<string>();
  const confusableCharacters = confusableCollection
    .filter(({ point }) => {
      if (uniquePoints.has(point)) {
        return false;
      }
      uniquePoints.add(point);
      return true;
    })
    .filter(({ similarTo }) => similarTo !== undefined);

  if (confusableCharacters.length) {
    const hasZeroWidthCharacters = confusableCharacters.some(
      ({ similarTo }) => similarTo === '',
    );

    if (hasZeroWidthCharacters) {
      return {
        error: 'invalidAddress',
        warning: 'confusableZeroWidthUnicode',
      };
    }

    return {
      confusableCharacters,
    };
  }
  return {};
};

const LOWER_CASED_BURN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0x000000000000000000000000000000000000dead',
];

export const validateEvmHexAddress = async (
  address: string,
  chainId?: string,
  assetAddress?: string,
) => {
  if (LOWER_CASED_BURN_ADDRESSES.includes(address.toLowerCase())) {
    return {
      error: 'invalidAddress',
    };
  }

  if (address?.toLowerCase() === assetAddress?.toLowerCase()) {
    return {
      error: 'contractAddressError',
    };
  }

  if (chainId) {
    const tokenDetails = await getTokenStandardAndDetailsByChain(
      address,
      undefined,
      undefined,
      chainId,
    );
    if (tokenDetails?.standard) {
      return {
        error: 'tokenContractError',
      };
    }
  }

  return {};
};

// Common Solana burn addresses - addresses commonly used as burn destinations
const SOLANA_BURN_ADDRESSES = [
  '1nc1nerator11111111111111111111111111111111',
  'So11111111111111111111111111111111111111112',
];

export const validateSolanaAddress = (address: string) => {
  if (SOLANA_BURN_ADDRESSES.includes(address)) {
    return {
      error: 'invalidAddress',
    };
  }

  if (!isSolanaAddress(address)) {
    return {
      error: 'invalidAddress',
    };
  }

  return {};
};

export const validateBtcAddress = (address: string) => {
  if (!isBtcMainnetAddress(address)) {
    return {
      error: 'invalidAddress',
    };
  }

  return {};
};
