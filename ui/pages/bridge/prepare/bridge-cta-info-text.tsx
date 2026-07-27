import React from 'react';
import { useSelector } from 'react-redux';
import { BRIDGE_MM_FEE_RATE } from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import { Text } from '../../../components/component-library';
import {
  getBridgeQuotes,
  BridgeAppState,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Row } from '../layout';
import { readMmFee } from '../utils/quote';

export const BridgeCTAInfoText = () => {
  const t = useI18nContext();

  const { activeQuote } = useSelector(getBridgeQuotes);

  const { isQuoteExpired } = useSelector((state) =>
    getValidationErrors(state as BridgeAppState, Date.now()),
  );

  const hasMMFee = new BigNumber(
    activeQuote?.quote.feeData.metabridge.amount ?? '0',
  ).gt(0);

  if (!activeQuote) {
    return null;
  }

  if (isQuoteExpired) {
    return null;
  }

  const { isDiscounted, quoteFeePercentage } = readMmFee(activeQuote);
  const showMmFeeText = hasMMFee && !isDiscounted;

  if (!showMmFeeText) {
    return null;
  }

  return (
    <Row
      gap={1}
      justifyContent={JustifyContent.center}
      data-testid="bridge-cta-info-text"
    >
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
        {t('bridgeFeeDisclaimer', [quoteFeePercentage ?? BRIDGE_MM_FEE_RATE])}
      </Text>
    </Row>
  );
};
