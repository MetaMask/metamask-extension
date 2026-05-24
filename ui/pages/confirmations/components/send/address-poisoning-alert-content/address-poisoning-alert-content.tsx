import React from 'react';
import {
  BackgroundColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../../components/component-library';
import Disclosure from '../../../../../components/ui/disclosure';
import { DisclosureVariant } from '../../../../../components/ui/disclosure/disclosure.constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { DiffHighlightedAddress } from '../diff-highlighted-address/diff-highlighted-address';

type AddressPoisoningAlertContentProps = {
  address: string;
  knownAddress: string;
  diffIndices: number[];
};

export function AddressPoisoningAlertContent({
  address,
  knownAddress,
  diffIndices,
}: AddressPoisoningAlertContentProps) {
  const t = useI18nContext();

  return (
    <Disclosure title={t('compareAddresses')} variant={DisclosureVariant.Arrow}>
      <Box className="mt-2 space-y-2">
        <DiffHighlightedAddress
          address={address}
          diffIndices={diffIndices}
          label={t('enteredMalicious')}
          dotBackgroundColor={BackgroundColor.errorDefault}
        />
        <DiffHighlightedAddress
          address={knownAddress}
          diffIndices={diffIndices}
          label={t('knownSafeAddress')}
          dotBackgroundColor={BackgroundColor.successDefault}
          highlightBackgroundColor={BackgroundColor.successMuted}
          diffTextColor={TextColor.successDefault}
        />
      </Box>
    </Disclosure>
  );
}
