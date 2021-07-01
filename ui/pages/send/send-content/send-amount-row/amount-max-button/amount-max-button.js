import React from 'react';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { getBasicGasEstimateLoadingStatus } from '../../../../../selectors';
import {
  getSendMaxModeState,
  isSendFormInvalid,
  toggleSendMaxMode,
} from '../../../../../ducks/send';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useMetricEvent } from '../../../../../hooks/useMetricEvent';

export default function AmountMaxButton() {
  const buttonDataLoading = useSelector(getBasicGasEstimateLoadingStatus);
  const isDraftTransactionInvalid = useSelector(isSendFormInvalid);
  const maxModeOn = useSelector(getSendMaxModeState);
  const dispatch = useDispatch();
  const trackClickedMax = useMetricEvent({
    eventOpts: {
      category: 'Transactions',
      action: 'Edit Screen',
      name: 'Clicked "Amount Max"',
    },
  });
  const t = useI18nContext();

  const onMaxClick = () => {
    trackClickedMax();
    dispatch(toggleSendMaxMode());
  };

  return (
    <button
      className="send-v2__amount-max"
      disabled={buttonDataLoading || isDraftTransactionInvalid}
      onClick={onMaxClick}
    >
      <input type="checkbox" checked={maxModeOn} readOnly />
      <div
        className={classnames('send-v2__amount-max__button', {
          'send-v2__amount-max__button__disabled':
            buttonDataLoading || isDraftTransactionInvalid,
        })}
      >
        {t('max')}
      </div>
    </button>
  );
}
