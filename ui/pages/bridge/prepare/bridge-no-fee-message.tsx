import React from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../../../components/component-library';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Row } from '../layout';

export const BridgeNoFeeMessage = () => {
  const t = useI18nContext();
  const { activeQuote } = useSelector(getBridgeQuotes);

  if (!activeQuote) {
    return null;
  }

  const hasNoMMFee = Number(activeQuote.quote.feeData.metabridge.amount) === 0;

  if (!hasNoMMFee) {
    return null;
  }

  return (
    <Row gap={1} justifyContent={JustifyContent.center}>
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
        {t('noMMFeeSwapping')}
      </Text>
    </Row>
  );
};
