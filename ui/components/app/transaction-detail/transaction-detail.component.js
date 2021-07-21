import React, { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isEqual } from 'lodash';

import { I18nContext } from '../../../contexts/i18n';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';

import TransactionDetailItem from '../transaction-detail-item/transaction-detail-item.component';

const LOADING_CLASS = 'transaction-detail--loading';
export default function TransactionDetail({ rows = [], onEdit }) {
  const t = useContext(I18nContext);

  const { isGasEstimatesLoading, gasFeeEstimates } = useGasFeeEstimates();

  // Do the animation only when gas prices have changed...
  const lastGasEstimates = useRef(gasFeeEstimates);
  const gasEstimatesChanged = !isEqual(
    lastGasEstimates.current,
    gasFeeEstimates,
  );

  // ... and only if gas didn't just load
  // Removing this line will cause the initial loading screen to stay empty
  const gasJustLoaded = isEqual(lastGasEstimates.current, {});

  if (gasEstimatesChanged) {
    lastGasEstimates.current = gasFeeEstimates;
  }

  const showLoadingAnimation =
    isGasEstimatesLoading || (gasEstimatesChanged && !gasJustLoaded);

  // When the loading animation completes, remove the className to reveal contents
  const container = useRef(null);
  useEffect(() => {
    const eventName = 'transitionend';
    const node = container?.current;
    const eventHandler = () => {
      node?.classList.remove(LOADING_CLASS);
    };

    node?.addEventListener(eventName, eventHandler);
    return () => {
      node?.removeEventListener(eventName, eventHandler);
    };
  }, [container]);

  return (
    <div
      ref={container}
      className={classNames('transaction-detail', {
        [LOADING_CLASS]: showLoadingAnimation,
      })}
    >
      {onEdit && (
        <div className="transaction-detail-edit">
          <button onClick={onEdit}>{t('edit')}</button>
        </div>
      )}
      <div className="transaction-detail-rows">{rows}</div>
    </div>
  );
}

TransactionDetail.propTypes = {
  rows: PropTypes.arrayOf(TransactionDetailItem).isRequired,
  onEdit: PropTypes.func,
};
