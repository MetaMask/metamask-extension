import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { I18nContext } from '../../../contexts/i18n';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  getFetchParams,
  getApproveTxParams,
  prepareToLeaveSwaps,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import {
  DEFAULT_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import PulseLoader from '../../../components/ui/pulse-loader';
import Typography from '../../../components/ui/typography';
import Box from '../../../components/ui/box';
import {
  BLOCK_SIZES,
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import SwapsFooter from '../swaps-footer';
import SwapStepIcon from './swap-step-icon';

export default function AwaitingSignatures() {
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const fetchParams = useSelector(getFetchParams);
  const { destinationTokenInfo, sourceTokenInfo } = fetchParams?.metaData || {};
  const approveTxParams = useSelector(getApproveTxParams);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
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
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: hardwareWalletType,
    },
    category: 'swaps',
  });

  useEffect(() => {
    awaitingSignaturesEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        justifyContent={JUSTIFY_CONTENT.CENTER}
        display={DISPLAY.FLEX}
        className="awaiting-signatures__content"
      >
        <Box marginTop={3} marginBottom={4}>
          <PulseLoader />
        </Box>
        <Typography color={COLORS.BLACK} variant={TYPOGRAPHY.H3}>
          {headerText}
        </Typography>
        {needsTwoConfirmations && (
          <>
            <Typography
              variant={TYPOGRAPHY.Paragraph}
              boxProps={{ marginTop: 2 }}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('swapToConfirmWithHwWallet')}
            </Typography>
            <ul className="awaiting-signatures__steps">
              <li>
                <SwapStepIcon stepNumber={1} />
                {t('swapAllowSwappingOf', [
                  <Typography
                    tag="span"
                    fontWeight={FONT_WEIGHT.BOLD}
                    key="allowToken"
                  >
                    {destinationTokenInfo?.symbol}
                  </Typography>,
                ])}
              </li>
              <li>
                <SwapStepIcon stepNumber={2} />
                {t('swapFromTo', [
                  <Typography
                    tag="span"
                    fontWeight={FONT_WEIGHT.BOLD}
                    key="tokenFrom"
                  >
                    {sourceTokenInfo?.symbol}
                  </Typography>,
                  <Typography
                    tag="span"
                    fontWeight={FONT_WEIGHT.BOLD}
                    key="tokenTo"
                  >
                    {destinationTokenInfo?.symbol}
                  </Typography>,
                ])}
              </li>
            </ul>
            <Typography variant={TYPOGRAPHY.Paragraph}>
              {t('swapGasFeesSplit')}
            </Typography>
          </>
        )}
      </Box>
      <SwapsFooter
        onSubmit={async () => {
          await dispatch(prepareToLeaveSwaps());
          // Go to the default route and then to the build quote route in order to clean up
          // the `inputValue` local state in `pages/swaps/index.js`
          history.push(DEFAULT_ROUTE);
          history.push(BUILD_QUOTE_ROUTE);
        }}
        submitText={t('cancel')}
        hideCancel
      />
    </div>
  );
}
