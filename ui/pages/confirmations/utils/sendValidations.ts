// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';

import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import {
  isBtcMainnetAddress,
  isSolanaAddress,
  isStellarAddress,
  isTronAddress,
} from '../../../../shared/lib/multichain/accounts';
import { areTronAddressesEqual } from '../../../../shared/lib/multichain/addresses/tron';

import { Asset, RecipientValidationResult } from '../types/send';
import { LOWER_CASED_BURN_ADDRESSES } from '../constants/token';

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

export const validateEvmHexAddress = (
  address: string,
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

const TRON_TRC10_ASSET_NAMESPACE = 'trc10';

/**
 * Returns whether a Tron send asset is rejected by the chain for self-transfers
 * (native TRX and TRC-10). TRC-20 and other assets may still be sent to self.
 */
export const isTronSelfTransferDisallowedAsset = (
  asset?: Pick<Asset, 'isNative' | 'assetId'>,
): boolean => {
  if (!asset) {
    return false;
  }

  if (asset.isNative === true) {
    return true;
  }

  if (asset.assetId && isCaipAssetType(asset.assetId)) {
    const { assetNamespace } = parseCaipAssetType(asset.assetId);
    return assetNamespace === TRON_TRC10_ASSET_NAMESPACE;
  }

  return false;
};

export const validateTronAddress = (
  address: string,
  fromAddress?: string,
  asset?: Pick<Asset, 'isNative' | 'assetId'>,
) => {
  if (!isTronAddress(address)) {
    return {
      error: 'invalidAddress',
    };
  }

  if (
    fromAddress &&
    areTronAddressesEqual(address, fromAddress) &&
    isTronSelfTransferDisallowedAsset(asset)
  ) {
    return {
      error: 'tronSelfTransferError',
    };
  }

  return {};
};

export const validateStellarAddress = (address: string) => {
  if (!isStellarAddress(address)) {
    return {
      error: 'invalidAddress',
    };
  }

  return {};
};
