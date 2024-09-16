import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { TextVariant } from '../../../../../helpers/constants/design-system';
import { ButtonLink } from '../../../../component-library';
import {
  DraftTransaction,
  estimateFee,
  setMaxSendAssetAmount,
  updateSendAmount,
} from '../../../../../ducks/multichain-send/multichain-send';
import { getSelectedInternalAccount } from '../../../../../selectors';

export type MultichainMaxClearButtonProps = {
  draftTransaction: DraftTransaction;
};

export const MultichainMaxClearButton = ({
  draftTransaction,
}: MultichainMaxClearButtonProps) => {
  const t = useI18nContext();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const dispatch = useDispatch();
  const { amount } = draftTransaction.transactionParams.sendAsset;
  const amountIsZero = amount === '0';

  const onClick = async () => {
    if (!amountIsZero) {
      dispatch(updateSendAmount('0x0'));
      return;
    }
    await dispatch(
      setMaxSendAssetAmount({ transactionId: draftTransaction.id }),
    );
    await dispatch(
      estimateFee({
        account: selectedAccount,
        transactionId: draftTransaction.id,
      }),
    );
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
