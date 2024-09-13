import React from 'react';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { ButtonLink } from '../../../../component-library';
import {
  DraftTransaction,
  setMaxSendAssetAmount,
  updateSendAmount,
} from '../../../../../ducks/multichain-send/multichain-send';

export type MultichainMaxClearButtonProps = {
  draftTransaction: DraftTransaction;
};

export const MultichainMaxClearButton = ({
  draftTransaction,
}: MultichainMaxClearButtonProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { amount } = draftTransaction.transactionParams.sendAsset;
  const amountIsZero = amount === '0';

  console.log('max button', draftTransaction);

  const onClick = () => {
    if (amount) {
      dispatch(updateSendAmount('0x0'));
    }
    dispatch(setMaxSendAssetAmount({ transactionId: draftTransaction.id }));
  };

  return (
    <ButtonLink
      className="asset-picker-amount__max-clear"
      onClick={onClick}
      marginLeft="auto"
      textProps={{ variant: TextVariant.bodySm }}
      data-testid="max-clear-button"
    >
      {amountIsZero ? t('max') : t('clear')}
    </ButtonLink>
  );
};
