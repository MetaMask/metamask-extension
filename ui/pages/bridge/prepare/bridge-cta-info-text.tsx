import React from 'react';
import { useSelector } from 'react-redux';
import {
  BRIDGE_MM_FEE_RATE,
  isCrossChain,
  sumAmounts,
} from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import { KnownCaipNamespace, parseCaipAssetType } from '@metamask/utils';
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
    activeQuote
      ? (sumAmounts(activeQuote.quote.feeData.metabridge)?.amount ?? '0')
      : '0',
  ).gt(0);

  const hasApproval =
    activeQuote &&
    (activeQuote.namespace === KnownCaipNamespace.Eip155 ||
      activeQuote.namespace === KnownCaipNamespace.Tron)
      ? activeQuote.approval
      : undefined;

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
      ? t('bridgeFeeDisclaimer', [quoteFeePercentage ?? BRIDGE_MM_FEE_RATE])
      : null,
    showApprovalText &&
      (isCrossChain(
        activeQuote.chainId,
        parseCaipAssetType(activeQuote.quote.dest.asset.assetId).chainId,
      )
        ? t('willApproveAmountForBridging')
        : t('willApproveAmountForSwapping')),
  ]
    .filter(Boolean)
    .join(showMmFeeText && showApprovalText ? '. ' : ' ');

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
                activeQuote.quote.src.normalizedAmount,
                activeQuote.quote.src.asset.symbol,
                activeQuote.quote.dest.asset.symbol,
              ])
            : t('bridgeApprovalWarning', [
                activeQuote.quote.src.normalizedAmount,
                activeQuote.quote.src.asset.symbol,
              ])}
        </Tooltip>
      ) : null}
    </Row>
  );
};
