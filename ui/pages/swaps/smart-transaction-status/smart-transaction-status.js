import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { I18nContext } from '../../../contexts/i18n';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  getFetchParams,
  prepareToLeaveSwaps,
  getSmartTransactionsStatus,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import PulseLoader from '../../../components/ui/pulse-loader';
import Typography from '../../../components/ui/typography';
import Box from '../../../components/ui/box';
import {
  BLOCK_SIZES,
  COLORS,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import SwapSuccessIcon from '../awaiting-swap/swap-success-icon';
import SwapFailureIcon from '../awaiting-swap/swap-failure-icon';
import { fetchSmartTransactionsStatus } from '../../../store/actions';
import { SECOND } from '../../../../shared/constants/time';

import SwapsFooter from '../swaps-footer';

const SMART_TRANSACTIONS_STATUS_INTERVAL = SECOND * 10; // Poll every 10 seconds.

export default function SmartTransactionStatus() {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const fetchParams = useSelector(getFetchParams);
  const { destinationTokenInfo, sourceTokenInfo } = fetchParams?.metaData || {};
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const needsTwoConfirmations = true;
  const [uuid] = useState('uuid1'); // TODO: Load status from Redux instead.
  const smartTransactionsStatus = useSelector(getSmartTransactionsStatus);
  const smartTransactionStatus = smartTransactionsStatus?.[0]?.status || {};

  const stStatusPageLoadedEvent = useNewMetricEvent({
    event: 'ST Status Page Loaded',
    sensitiveProperties: {
      needs_two_confirmations: needsTwoConfirmations,
      token_from: sourceTokenInfo?.symbol,
      token_from_amount: fetchParams?.value,
      token_to: destinationTokenInfo?.symbol,
      request_type: fetchParams?.balanceError ? 'Quote' : 'Order',
      slippage: fetchParams?.slippage,
      custom_slippage: fetchParams?.slippage === 2,
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: hardwareWalletType,
    },
    category: 'swaps',
  });

  const isSmartTransactionPending =
    !smartTransactionStatus.minedTx ||
    (smartTransactionStatus.minedTx === 'not_mined' &&
      smartTransactionStatus.cancellationReason === 'not_cancelled');

  useEffect(() => {
    stStatusPageLoadedEvent();
    const intervalId = setInterval(() => {
      if (isSmartTransactionPending) {
        dispatch(fetchSmartTransactionsStatus([uuid]));
      } else {
        clearInterval(intervalId);
      }
    }, SMART_TRANSACTIONS_STATUS_INTERVAL);
    // if (isSmartTransactionPending) {
    //   dispatch(fetchSmartTransactionsStatus([uuid]));
    // }
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isSmartTransactionPending]);

  let headerText = t('stPending');
  let description = t('stPendingDescription');
  let icon = <PulseLoader />;
  if (smartTransactionStatus.minedTx === 'success') {
    headerText = t('stSuccess');
    description = t('stSuccessDescription');
    icon = <SwapSuccessIcon />;
  } else if (
    smartTransactionStatus.cancellationReason &&
    smartTransactionStatus.cancellationReason !== 'not_cancelled'
  ) {
    headerText = t('stFailure');
    description = t('stFailureDescription', [
      <a
        className="smart-transaction-status__support-link"
        key="smart-transaction-status-support-link"
        href="https://support.metamask.io"
        target="_blank"
        rel="noopener noreferrer"
      >
        support.metamask.io
      </a>,
    ]);
    icon = <SwapFailureIcon />;
  }

  return (
    <div className="smart-transaction-status">
      <Box
        paddingLeft={8}
        paddingRight={8}
        height={BLOCK_SIZES.FULL}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        display={DISPLAY.FLEX}
        className="smart-transaction-status__content"
      >
        <Box marginTop={3} marginBottom={4}>
          {icon}
        </Box>
        <Typography color={COLORS.BLACK} variant={TYPOGRAPHY.H3}>
          {headerText}
        </Typography>
        <Typography variant={TYPOGRAPHY.Paragraph} boxProps={{ marginTop: 2 }}>
          {description}
        </Typography>
      </Box>
      <SwapsFooter
        onSubmit={async () => {
          await dispatch(prepareToLeaveSwaps());
          // Go to the default route and then to the build quote route in order to clean up
          // the `inputValue` local state in `pages/swaps/index.js`
          history.push(DEFAULT_ROUTE);
        }}
        submitText={isSmartTransactionPending ? t('cancel') : t('close')}
        hideCancel
      />
    </div>
  );
}
