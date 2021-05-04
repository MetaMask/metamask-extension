import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { I18nContext } from '../../../contexts/i18n';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  getFetchParams,
  getApproveTxParams,
  navigateBackToBuildQuote,
} from '../../../ducks/swaps/swaps';
import PulseLoader from '../../../components/ui/pulse-loader';
import SwapsFooter from '../swaps-footer';
import SwapStepIcon from './swap-step-icon';

export default function AwaitingSignatures() {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const fetchParams = useSelector(getFetchParams);
  const { destinationTokenInfo, sourceTokenInfo } = fetchParams?.metaData || {};
  const approveTxParams = useSelector(getApproveTxParams);
  const needsTwoConfirmations = Boolean(approveTxParams);

  const awaitingSignaturesEvent = useNewMetricEvent({
    event: 'Awaiting Signature(s) on a HW wallet',
    sensitiveProperties: {
      needs_two_confirmations: needsTwoConfirmations,
      token_from: sourceTokenInfo?.symbol,
      token_from_amount: fetchParams?.value,
      token_to: destinationTokenInfo?.symbol,
      request_type: fetchParams?.balanceError ? 'Quote' : 'Order',
      slippage: fetchParams?.slippage,
      custom_slippage: fetchParams?.slippage === 2,
    },
    category: 'swaps',
  });

  useEffect(() => {
    awaitingSignaturesEvent();
  }, [awaitingSignaturesEvent]);

  const headerText = needsTwoConfirmations
    ? t('swapTwoTransactions')
    : t('swapConfirmWithHwWallet');

  return (
    <div className="awaiting-signatures">
      <div className="awaiting-signatures__content">
        <div className="awaiting-signatures__status-image">
          <PulseLoader />
        </div>
        <div className="awaiting-signatures__header">{headerText}</div>
        {needsTwoConfirmations && (
          <>
            <p className="awaiting-signatures__subheader">
              {t('swapToConfirmWithHwWallet')}
            </p>
            <ul className="awaiting-signatures__steps">
              <li>
                <SwapStepIcon stepNumber={1} />
                {t('swapAllowSwappingOf', [
                  <span
                    className="awaiting-signatures__symbol"
                    key="allowToken"
                  >
                    {destinationTokenInfo.symbol}
                  </span>,
                ])}
              </li>
              <li>
                <SwapStepIcon stepNumber={2} />
                {t('swapFromTo', [
                  <span className="awaiting-signatures__symbol" key="tokenFrom">
                    {sourceTokenInfo.symbol}
                  </span>,
                  <span className="awaiting-signatures__symbol" key="tokenTo">
                    {destinationTokenInfo.symbol}
                  </span>,
                ])}
              </li>
            </ul>
            <div className="awaiting-signatures__main-description">
              {t('swapGasFeesSplit')}
            </div>
          </>
        )}
      </div>
      <SwapsFooter
        onSubmit={async () => {
          await dispatch(navigateBackToBuildQuote(history));
        }}
        submitText={t('cancel')}
        hideCancel
      />
    </div>
  );
}
