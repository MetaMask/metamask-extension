import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { BRIDGE_MM_FEE_RATE, sumAmounts } from '@metamask/bridge-controller';
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

  const { isQuoteExpired } = useSelector(
    (state: BridgeAppState) => getValidationErrors(state, Date.now()),
    shallowEqual,
  );

  const mmFee =
    activeQuote && sumAmounts(activeQuote?.quote.feeData.metabridge)?.amount;
  const hasMMFee = new BigNumber(mmFee ?? '0').gt(0);

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
