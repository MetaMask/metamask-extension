import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { I18nContext } from '../../../contexts/i18n';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  getFetchParams,
  prepareToLeaveSwaps,
  getSmartTransactionsStatus,
  getLatestSmartTransactionUuid,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE, ASSET_ROUTE } from '../../../helpers/constants/routes';
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
import {
  fetchSmartTransactionsStatus,
  stopPollingForQuotes,
  cancelSmartTransaction,
} from '../../../store/actions';
import { SECOND } from '../../../../shared/constants/time';
import SwapsFooter from '../swaps-footer';
import SuccessIcon from './success-icon';
import RevertedIcon from './reverted-icon';
import CanceledIcon from './canceled-icon';
import BackgroundAnimation from './background-animation';

const SMART_TRANSACTIONS_STATUS_INTERVAL = SECOND * 10; // Poll every 10 seconds.

// It takes about 2s to show the link (waiting for uuid) and then it will be visible for about 10s or until a user clicks on it.
const CANCEL_LINK_DURATION = SECOND * 12;

export default function SmartTransactionStatus() {
  const [showCancelSwapLink, setShowCancelSwapLink] = useState(() => {
    setTimeout(() => {
      setShowCancelSwapLink(false);
    }, CANCEL_LINK_DURATION);
    return true;
  });
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const fetchParams = useSelector(getFetchParams);
  const { destinationTokenInfo, sourceTokenInfo } = fetchParams?.metaData || {
    destinationTokenInfo: {
      address: 'address',
      symbol: 'ETH',
    },
  };
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const needsTwoConfirmations = true;
  const smartTransactionsStatus = useSelector(getSmartTransactionsStatus);
  const latestSmartTransactionUuid = useSelector(getLatestSmartTransactionUuid);
  const smartTransactionStatus =
    smartTransactionsStatus?.[latestSmartTransactionUuid] || {}; // TODO: Use a list of STX from the STX controller.

  const sensitiveProperties = {
    needs_two_confirmations: needsTwoConfirmations,
    token_from: sourceTokenInfo?.symbol,
    token_from_amount: fetchParams?.value,
    token_to: destinationTokenInfo?.symbol,
    request_type: fetchParams?.balanceError ? 'Quote' : 'Order',
    slippage: fetchParams?.slippage,
    custom_slippage: fetchParams?.slippage === 2,
    is_hardware_wallet: hardwareWalletUsed,
    hardware_wallet_type: hardwareWalletType,
    stx_uuid: latestSmartTransactionUuid,
  };

  const stxStatusPageLoadedEvent = useNewMetricEvent({
    event: 'STX Status Page Loaded',
    sensitiveProperties,
    category: 'swaps',
  });

  const cancelSmartTransactionEvent = useNewMetricEvent({
    event: 'Cancel STX',
    sensitiveProperties,
    category: 'swaps',
  });

  const isSmartTransactionPending =
    !smartTransactionStatus.minedTx ||
    (smartTransactionStatus.minedTx === 'not_mined' &&
      smartTransactionStatus.cancellationReason === 'not_cancelled');

  useEffect(() => {
    stxStatusPageLoadedEvent();
    const intervalId = setInterval(() => {
      if (isSmartTransactionPending && latestSmartTransactionUuid) {
        dispatch(fetchSmartTransactionsStatus([latestSmartTransactionUuid]));
      } else {
        clearInterval(intervalId);
      }
    }, SMART_TRANSACTIONS_STATUS_INTERVAL);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isSmartTransactionPending, latestSmartTransactionUuid]);

  useEffect(() => {
    // We don't need to poll for quotes on the status page.
    dispatch(stopPollingForQuotes());
  }, [dispatch]);

  const onClickTokenTo = async (e) => {
    e?.preventDefault();
    await dispatch(prepareToLeaveSwaps());
    history.push(`${ASSET_ROUTE}/${destinationTokenInfo?.address}`);
  };

  let headerText = t('stxPending');
  let description;
  let subDescription;
  let icon = <PulseLoader />;
  if (smartTransactionStatus.minedTx === 'success') {
    headerText = t('stxSuccess');
    description = t('stxSuccessDescription', [
      <a
        className="smart-transaction-status__token-to-link"
        key="smart-transaction-status__token-to-link"
        href="#"
        onClick={onClickTokenTo}
      >
        {destinationTokenInfo?.symbol}
      </a>,
    ]);
    icon = <SuccessIcon />;
  } else if (
    smartTransactionStatus.minedTx === 'cancelled' &&
    smartTransactionStatus.cancellationReason &&
    smartTransactionStatus.cancellationReason !== 'user_cancelled'
  ) {
    headerText = t('stxCancelled');
    description = t('stxCancelledDescription');
    subDescription = t('stxCancelledSubDescription');
    icon = <CanceledIcon />;
  } else if (
    smartTransactionStatus.cancellationReason &&
    smartTransactionStatus.cancellationReason === 'user_cancelled'
  ) {
    headerText = t('stxUserCancelled');
    description = t('stxUserCancelledDescription');
    icon = <CanceledIcon />;
  } else if (
    smartTransactionStatus.minedTx &&
    smartTransactionStatus.minedTx === 'reverted'
  ) {
    headerText = t('stxFailure');
    description = t('stxFailureDescription', [
      <a
        className="smart-transaction-status__support-link"
        key="smart-transaction-status-support-link"
        href="https://support.metamask.io"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('customerSupport')}
      </a>,
    ]);
    icon = <RevertedIcon />;
  }

  const CancelSwap = () => {
    return (
      <Box marginBottom={3}>
        <a
          href="#"
          onClick={(e) => {
            e?.preventDefault();
            setShowCancelSwapLink(false); // We want to hide it after a user clicks on it.
            cancelSmartTransactionEvent();
            dispatch(cancelSmartTransaction(latestSmartTransactionUuid));
          }}
        >
          {t('cancelSwap')}
        </a>
      </Box>
    );
  };

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
          <Typography color={COLORS.UI4} variant={TYPOGRAPHY.H6}>
            {`${fetchParams?.value} ${sourceTokenInfo?.symbol}`}
            ->
            {`~${fetchParams?.value} ${destinationTokenInfo?.symbol}`}
          </Typography>
        </Box>
        <BackgroundAnimation position="top" />
        <Box marginTop={3} marginBottom={4}>
          {icon}
        </Box>
        <Typography color={COLORS.BLACK} variant={TYPOGRAPHY.H3}>
          {headerText}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.Paragraph}
          boxProps={{ marginTop: 2 }}
          color={COLORS.UI4}
        >
          {description}
        </Typography>
        <BackgroundAnimation position="bottom" />
        {subDescription && (
          <Typography
            variant={TYPOGRAPHY.H8}
            boxProps={{ marginTop: 2 }}
            color={COLORS.UI4}
          >
            {subDescription}
          </Typography>
        )}
      </Box>
      {showCancelSwapLink &&
        latestSmartTransactionUuid &&
        isSmartTransactionPending && <CancelSwap />}
      <SwapsFooter
        onSubmit={async () => {
          await dispatch(prepareToLeaveSwaps());
          history.push(DEFAULT_ROUTE);
        }}
        submitText={isSmartTransactionPending ? t('cancel') : t('close')}
        hideCancel
      />
    </div>
  );
}
