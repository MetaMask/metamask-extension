import React from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import { PopoverPosition, Text } from '../../../components/component-library';
import {
  getBridgeQuotes,
  BridgeAppState,
  getValidationErrors,
  getFromAccount,
  getFromChain,
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
import { bpsToPercentage } from '../../../ducks/bridge/utils';
import { RewardsVipTag } from '../../../components/app/rewards/RewardsVipTag';
import { formatAccountToCaipAccountId } from '../../../helpers/utils/rewards-utils';
import { BRIDGE_MM_FEE_RATE, isCrossChain } from '@metamask/bridge-controller';

export const BridgeCTAInfoText = () => {
  const t = useI18nContext();

  const { activeQuote } = useSelector(getBridgeQuotes);
  const fromAccount = useSelector(getFromAccount);
  const fromChain = useSelector(getFromChain);

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

  if (!hasMMFee && !hasApproval) {
    return null;
  }

  if (isQuoteExpired) {
    return null;
  }

  // Get the fee percentage from the quote or fallback to default
  // @ts-expect-error: controller types are not up to date yet
  const quoteBpsFee = activeQuote.quote.feeData?.metabridge?.quoteBpsFee;
  // @ts-expect-error: controller types are not up to date yet
  const baseBpsFee = activeQuote.quote.feeData?.metabridge?.baseBpsFee;
  const quoteFeePercentage = bpsToPercentage(quoteBpsFee) ?? BRIDGE_MM_FEE_RATE;
  const baseFeePercentage = bpsToPercentage(baseBpsFee) ?? BRIDGE_MM_FEE_RATE;

  const caipAccountId = formatAccountToCaipAccountId(fromAccount.address, fromChain?.chainId);
  // Render VIP tag and fees
if (caipAccountId && baseFeePercentage && quoteFeePercentage && baseFeePercentage !== quoteFeePercentage) {
  return (
    <Row gap={1} justifyContent={JustifyContent.center}>
      <RewardsVipTag accountId={caipAccountId} />
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative} style={{ textDecoration: 'line-through' }}>{t('percent', [baseFeePercentage])}</Text>
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>{t('percentFee', [quoteFeePercentage])}</Text>
    </Row>
  );
}

  return hasMMFee || hasApproval ? (
    <Row
      gap={1}
      justifyContent={JustifyContent.center}
      data-testid="bridge-cta-info-text"
    >
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
        {[
          hasMMFee ? t('rateIncludesMMFee', [quoteFeePercentage]) : null,
          hasApproval &&
            (isCrossChain(
              activeQuote.quote.srcChainId,
              activeQuote.quote.destChainId,
            )
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
