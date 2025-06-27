import React from 'react';
import { ConfirmInfoSection } from '../../../../../components/app/confirm/info/row/section';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';
import { useIntentsData } from '../../../hooks/transactions/useIntentsData';

export function IntentsRow() {
  const { sourceTokenAmountFormatted, networkFeeFiatFormatted } =
    useIntentsData();

  const text = `${sourceTokenAmountFormatted} USDC + ${networkFeeFiatFormatted} Gas`;

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label="Intents">
        <ConfirmInfoRowText text={text} />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
}
