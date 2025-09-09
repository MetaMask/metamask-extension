// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';

import { RecipientValidationResult } from '../types/send';

export type DomainValidationOptions = {
  chainId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lookupDomainAddresses: (chainId: string, domain: string) => Promise<any[]>;
  formatChainId?: (chainId: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterResolutions?: (resolutions: any[]) => any[];
  errorMessages: {
    unknownError: string;
    confusingDomain: string;
  };
};

export const validateDomainWithConfusables = async (
  address: string,
  options: DomainValidationOptions,
): Promise<RecipientValidationResult> => {
  try {
    const {
      chainId,
      lookupDomainAddresses,
      formatChainId,
      filterResolutions,
      errorMessages,
    } = options;

    const formattedChainId = formatChainId ? formatChainId(chainId) : chainId;
    const resolutions = await lookupDomainAddresses(formattedChainId, address);

    // Apply filtering if provided
    const filteredResolutions = filterResolutions
      ? filterResolutions(resolutions)
      : resolutions;

    console.log('OGP - filteredResolutions', filteredResolutions);
    if (!filteredResolutions || filteredResolutions.length === 0) {
      return { error: errorMessages.unknownError, isLookupLoading: false };
    }

    const resolvedLookup = filteredResolutions[0].resolvedAddress;
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
          resolvedLookup,
          isLookupLoading: false,
        };
      }

      return {
        confusableCharacters,
        error: null,
        isLookupLoading: false,
        resolvedLookup,
        warning: errorMessages.confusingDomain,
      };
    }

    return {
      error: null,
      resolvedLookup,
      warning: null,
      isLookupLoading: false,
    };
  } catch (error) {
    return {
      error: options.errorMessages.unknownError,
      isLookupLoading: false,
    };
  }
};
