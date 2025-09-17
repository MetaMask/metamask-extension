// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';

import { isSolanaAddress } from '../../../../shared/lib/multichain/accounts';
import {
  findNetworkClientIdByChainId,
  getERC721AssetSymbol,
} from '../../../store/actions';
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
      warning: 'confusingDomain',
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
) => {
  if (LOWER_CASED_BURN_ADDRESSES.includes(address.toLowerCase())) {
    return {
      error: 'invalidAddress',
    };
  }

  if (chainId) {
    const networkClientId = await findNetworkClientIdByChainId(chainId);
    if (networkClientId) {
      const symbol = await getERC721AssetSymbol(address, networkClientId);
      if (symbol) {
        // Contract address detected
        return {
          error: 'invalidAddress',
        };
      }
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
