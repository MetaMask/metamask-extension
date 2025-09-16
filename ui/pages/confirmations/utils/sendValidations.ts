// Unicode confusables is not typed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { confusables } from 'unicode-confusables';

import { RecipientValidationResult } from '../types/send';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const findConfusablesInRecipient = (
  address: string,
  t: ReturnType<typeof useI18nContext>,
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
        error: t('invalidAddress'),
        warning: t('confusableZeroWidthUnicode'),
      };
    }

    return {
      confusableCharacters,
      warning: t('confusingEnsDomain'),
    };
  }
  return {};
};
