import React from 'react';
import { useSelector } from 'react-redux';
import { Text } from '../../../components/component-library';
import {
  getBridgeQuotes,
  BridgeAppState,
  selectNoFeeAssets,
} from '../../../ducks/bridge/selectors';
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

  const noFeeAssets = useSelector((state: BridgeAppState) =>
    selectNoFeeAssets(state, activeQuote?.quote?.destChainId?.toString()),
  );

  if (!activeQuote) {
    return null;
  }

  const isNoFeeAsset = noFeeAssets.includes(
    activeQuote.quote.destAsset.address?.toLowerCase() ?? '',
  );

  if (!isNoFeeAsset) {
    return null;
  }

  const destSymbol = activeQuote.quote.destAsset?.symbol || 'token';

  return (
    <Row gap={1} justifyContent={JustifyContent.center}>
      <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>
        {t('noMMFeeSwapping', [destSymbol])}
      </Text>
    </Row>
  );
};
