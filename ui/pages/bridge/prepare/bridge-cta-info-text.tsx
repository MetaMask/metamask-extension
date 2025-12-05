import React from 'react';
import { useSelector } from 'react-redux';
import { BRIDGE_MM_FEE_RATE } from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import { PopoverPosition, Text } from '../../../components/component-library';
import {
  getBridgeQuotes,
  getIsQuoteExpired,
  BridgeAppState,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Row, Tooltip } from '../layout';
import { getCurrentKeyring } from '../../../selectors/selectors';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import { bpsToPercentage } from '../../../ducks/bridge/utils';

export const BridgeCTAInfoText = () => {
  const t = useI18nContext();

  const { activeQuote } = useSelector(getBridgeQuotes);

  const isQuoteExpired = useSelector((state) =>
    getIsQuoteExpired(state as BridgeAppState, Date.now()),
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

  if (!hasMMFee && !hasApproval) {
    return null;
  }

  if (isQuoteExpired) {
    return null;
  }

  // Get the fee percentage from the quote or fallback to default
  // @ts-expect-error: controller types are not up to date yet
  const quoteBpsFee = activeQuote.quote.feeData?.metabridge?.quoteBpsFee;
  const feePercentage = bpsToPercentage(quoteBpsFee) ?? BRIDGE_MM_FEE_RATE;

  return hasMMFee || hasApproval ? (
    <Row
      gap={1}
      justifyContent={JustifyContent.center}
      data-testid="bridge-cta-info-text"
    >
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
        {[
          hasMMFee ? t('rateIncludesMMFee', [feePercentage]) : null,
          hasApproval &&
            (activeQuote.quote.srcChainId === activeQuote.quote.destChainId
              ? t('willApproveAmountForBridging')
              : t('willApproveAmountForSwapping')),
        ]
          .filter(Boolean)
          .join(' ')}
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
  ) : null;
};
