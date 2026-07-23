import React, { useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { isCrossChain } from '@metamask/bridge-controller';

import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../../shared/lib/selectors/keyring';
import PulseLoader from '../../../components/ui/pulse-loader';
import {
  TextVariant,
  TextColor,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import {
  AvatarBase,
  AvatarBaseSize,
  Text,
} from '../../../components/component-library';
import {
  getBridgeQuotes,
  getFromChain,
  getFromToken,
  getToToken,
  getToChain,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useNavigateOnQrScanComplete } from '../hooks/useNavigateOnQrScanComplete';

export default function AwaitingSignatures() {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);

  // Navigate to activity tab when QR scan is completed
  useNavigateOnQrScanComplete();
  const fromAmount = activeQuote?.quote.src.normalizedAmount;
  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);
  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const needsTwoConfirmations = Boolean(activeQuote?.approval);
  const { trackEvent, createEventBuilder } = useAnalytics();

  useEffect(() => {
    trackEvent(
      createEventBuilder('Awaiting Signature(s) on a HW wallet')
        .addCategory(MetaMetricsEventCategory.Swaps)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          needs_two_confirmations: needsTwoConfirmations,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_from: fromToken?.symbol ?? '',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_to: toToken?.symbol ?? '',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_hardware_wallet: hardwareWalletUsed,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hardware_wallet_type: hardwareWalletType ?? '',
        })
        .addSensitiveProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_from_amount: activeQuote?.quote.src.amount ?? '',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_to_amount: activeQuote?.quote.dest.amount ?? '',
        })
        .build(),
    );
  }, []);

  const isSwap =
    fromChain && !isCrossChain(fromChain.chainId, toChain?.chainId);

  return (
    <div className="awaiting-bridge-signatures">
      <Box
        paddingLeft={6}
        paddingRight={6}
        className="h-full flex"
        justifyContent={BoxJustifyContent.Center}
        flexDirection={BoxFlexDirection.Column}
      >
        <Box marginTop={3} marginBottom={4}>
          <PulseLoader />
        </Box>
        {!needsTwoConfirmations && (
          <Text
            color={TextColor.textDefault}
            variant={TextVariant.headingMd}
            as="h3"
          >
            {t('swapConfirmWithHwWallet')}
          </Text>
        )}
        {needsTwoConfirmations && activeQuote && (
          <>
            <Text variant={TextVariant.bodyMdBold} marginTop={2}>
              {t('bridgeConfirmTwoTransactions')}
            </Text>
            <ul className="awaiting-bridge-signatures__steps">
              <li>
                <AvatarBase
                  size={AvatarBaseSize.Sm}
                  backgroundColor={BackgroundColor.primaryMuted}
                  color={TextColor.primaryDefault}
                  marginRight={2}
                >
                  1
                </AvatarBase>
                {t(
                  isSwap
                    ? 'unifiedSwapAllowSwappingOf'
                    : 'bridgeAllowSwappingOf',
                  [
                    activeQuote.quote.src.normalizedAmount,
                    fromToken?.symbol,
                    fromChain?.name,
                  ],
                )}
              </li>
              <li>
                <AvatarBase
                  size={AvatarBaseSize.Sm}
                  backgroundColor={BackgroundColor.primaryMuted}
                  color={TextColor.primaryDefault}
                  marginRight={2}
                >
                  2
                </AvatarBase>
                {t(isSwap ? 'unifiedSwapFromTo' : 'bridgeFromTo', [
                  fromAmount,
                  fromToken?.symbol,
                  isSwap ? toToken?.symbol : toChain?.name,
                ])}
              </li>
            </ul>
            <Text variant={TextVariant.bodyXs}>{t('bridgeGasFeesSplit')}</Text>
          </>
        )}
      </Box>
    </div>
  );
}
