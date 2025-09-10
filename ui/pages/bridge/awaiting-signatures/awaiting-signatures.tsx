import React, { useContext, useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import isEqual from 'lodash/isEqual';
import { isCrossChain } from '@metamask/bridge-controller';

import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import PulseLoader from '../../../components/ui/pulse-loader';
import {
  TextVariant,
  JustifyContent,
  TextColor,
  BlockSize,
  Display,
  FlexDirection,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import {
  AvatarBase,
  AvatarBaseSize,
  Box,
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function AwaitingSignatures() {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes, shallowEqual);
  const fromAmount = activeQuote?.sentAmount?.amount;
  const fromToken = useSelector(getFromToken, isEqual);
  const toToken = useSelector(getToToken, isEqual);
  const fromChain = useSelector(getFromChain, isEqual);
  const toChain = useSelector(getToChain, isEqual);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const needsTwoConfirmations = Boolean(activeQuote?.approval);
  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      event: 'Awaiting Signature(s) on a HW wallet',
      category: MetaMetricsEventCategory.Swaps,
      properties: {
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
      },
      sensitiveProperties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_from_amount: activeQuote?.quote?.srcTokenAmount ?? '',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_to_amount: activeQuote?.quote?.destTokenAmount ?? '',
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSwap =
    fromChain && !isCrossChain(fromChain.chainId, toChain?.chainId);

  return (
    <div className="awaiting-bridge-signatures">
      <Box
        paddingLeft={6}
        paddingRight={6}
        height={BlockSize.Full}
        justifyContent={JustifyContent.center}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
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
                    activeQuote.sentAmount?.amount,
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
                  toChain?.name,
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
