import React, { useContext, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import isEqual from 'lodash/isEqual';
import { I18nContext } from '../../../contexts/i18n';
import {
  getFetchParams,
  getApproveTxParams,
  prepareToLeaveSwaps,
  getCurrentSmartTransactionsEnabled,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import {
  getSmartTransactionsEnabled,
  getSmartTransactionsOptInStatusForMetrics,
} from '../../../../shared/modules/selectors';
import { PREPARE_SWAP_ROUTE } from '../../../helpers/constants/routes';
import PulseLoader from '../../../components/ui/pulse-loader';
import Box from '../../../components/ui/box';
import {
  BLOCK_SIZES,
  TextVariant,
  JustifyContent,
  DISPLAY,
  TextColor,
} from '../../../helpers/constants/design-system';
import SwapsFooter from '../swaps-footer';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { Text } from '../../../components/component-library';
import SwapStepIcon from './swap-step-icon';

export default function AwaitingSignatures() {
  const t = useContext(I18nContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fetchParams = useSelector(getFetchParams, isEqual);
  const { destinationTokenInfo, sourceTokenInfo } = fetchParams?.metaData || {};
  const approveTxParams = useSelector(getApproveTxParams, shallowEqual);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatusForMetrics,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const needsTwoConfirmations = Boolean(approveTxParams);
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      event: 'Awaiting Signature(s) on a HW wallet',
      category: MetaMetricsEventCategory.Swaps,
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
        stx_enabled: smartTransactionsEnabled,
        current_stx_enabled: currentSmartTransactionsEnabled,
        stx_user_opt_in: smartTransactionsOptInStatus,
      },
    });
  }, []);

  const headerText = needsTwoConfirmations
    ? t('swapTwoTransactions')
    : t('swapConfirmWithHwWallet');

  return (
    <div className="awaiting-signatures">
      <Box
        paddingLeft={8}
        paddingRight={8}
        height={BLOCK_SIZES.FULL}
        justifyContent={JustifyContent.center}
        display={DISPLAY.FLEX}
        className="awaiting-signatures__content"
      >
        <Box marginTop={3} marginBottom={4}>
          <PulseLoader />
        </Box>
        <Text
          color={TextColor.textDefault}
          variant={TextVariant.headingMd}
          as="h3"
        >
          {headerText}
        </Text>
        {needsTwoConfirmations && (
          <>
            <Text variant={TextVariant.bodyMdBold} marginTop={2}>
              {t('swapToConfirmWithHwWallet')}
            </Text>
            <ul className="awaiting-signatures__steps">
              <li>
                <SwapStepIcon stepNumber={1} />
                {t('swapAllowSwappingOf', [
                  <Text
                    as="span"
                    variant={TextVariant.bodyMdBold}
                    key="allowToken"
                  >
                    {destinationTokenInfo?.symbol}
                  </Text>,
                ])}
              </li>
              <li>
                <SwapStepIcon stepNumber={2} />
                {t('swapFromTo', [
                  <Text
                    as="span"
                    variant={TextVariant.bodyMdBold}
                    key="tokenFrom"
                  >
                    {sourceTokenInfo?.symbol}
                  </Text>,
                  <Text
                    as="span"
                    variation={TextVariant.bodyMdBold}
                    key="tokenTo"
                  >
                    {destinationTokenInfo?.symbol}
                  </Text>,
                ])}
              </li>
            </ul>
            <Text variant={TextVariant.bodyMd}>{t('swapGasFeesSplit')}</Text>
          </>
        )}
      </Box>
      <SwapsFooter
        onSubmit={async () => {
          await dispatch(prepareToLeaveSwaps());
          // prepareToLeaveSwaps() clears all swaps state, so we can navigate directly
          navigate(PREPARE_SWAP_ROUTE);
        }}
        submitText={t('cancel')}
        hideCancel
      />
    </div>
  );
}
