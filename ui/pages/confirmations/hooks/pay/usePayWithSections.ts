import { useMemo } from 'react';
import type { PayWithSectionConfig } from '../../components/modals/pay-with-modal/pay-with-modal.types';
import { usePayWithCryptoSection } from './sections/usePayWithCryptoSection';
import { usePayWithMoneyAccountSection } from './sections/usePayWithMoneyAccountSection';

export type UsePayWithSectionsResult = {
  sections: PayWithSectionConfig[];
};

type UsePayWithSectionsArgs = {
  onClose: () => void;
  onOtherAssetsPress: () => void;
};

export function usePayWithSections({
  onClose,
  onOtherAssetsPress,
}: UsePayWithSectionsArgs): UsePayWithSectionsResult {
  const moneyAccountSection = usePayWithMoneyAccountSection({ onClose });
  const cryptoSection = usePayWithCryptoSection({
    onClose,
    onOtherAssetsPress,
  });

  return useMemo(
    () => ({
      sections: [moneyAccountSection, cryptoSection].filter(
        (section): section is PayWithSectionConfig => section !== null,
      ),
    }),
    [cryptoSection, moneyAccountSection],
  );
}
