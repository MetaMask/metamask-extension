import React from 'react';
import { useSelector } from 'react-redux';
import { BRIDGE_MM_FEE_RATE, isCrossChain } from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import { PopoverPosition, Text } from '../../../components/component-library';
import {
  getBridgeQuotes,
  BridgeAppState,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Row, Tooltip } from '../layout';
import { getCurrentKeyring } from '../../../../shared/lib/selectors/keyring';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { readMmFee } from '../utils/quote';

export const BridgeCTAInfoText = () => {
  const t = useI18nContext();

  const { activeQuote } = useSelector(getBridgeQuotes);

  const { isQuoteExpired } = useSelector((state) =>
    getValidationErrors(state as BridgeAppState, Date.now()),
  );

  const keyring = useSelector(getCurrentKeyring);
  const isUsingHardwareWallet = isHardwareKeyring(keyring?.type);

  const hasMMFee = new BigNumber(
    activeQuote?.quote.feeData.metabridge.amount ?? '0',
  ).gt(0);

  const hasApproval = activeQuote?.approval;

  if (!activeQuote) {
    return null;
  }

  if (isQuoteExpired) {
    return null;
  }

  const { isDiscounted, quoteFeePercentage } = readMmFee(activeQuote);
  const showMmFeeText = hasMMFee && !isDiscounted;
  const showApprovalText = Boolean(hasApproval);

  const infoText = [
    showMmFeeText
      ? t('rateIncludesMMFee', [quoteFeePercentage ?? BRIDGE_MM_FEE_RATE])
      : null,
    showApprovalText &&
      (isCrossChain(activeQuote.quote.srcChainId, activeQuote.quote.destChainId)
        ? t('willApproveAmountForBridging')
        : t('willApproveAmountForSwapping')),
  ]
    .filter(Boolean)
    .join(' ');

  if (!infoText) {
    return null;
  }

  return (
    <Row
      gap={1}
      justifyContent={JustifyContent.center}
      data-testid="bridge-cta-info-text"
    >
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
        {infoText}
      </Text>

      {hasApproval ? (
        <Tooltip
          display={Display.InlineBlock}
          position={PopoverPosition.Top}
          offset={[-48, 8]}
          title={t('grantExactAccess')}
        >
          {isUsingHardwareWallet
            ? t('bridgeApprovalWarningForHardware', [
                activeQuote.sentAmount.amount,
                activeQuote.quote.srcAsset.symbol,
                activeQuote.quote.destAsset.symbol,
              ])
            : t('bridgeApprovalWarning', [
                activeQuote.sentAmount.amount,
                activeQuote.quote.srcAsset.symbol,
              ])}
        </Tooltip>
      ) : null}
    </Row>
  );
};
