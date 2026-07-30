import React from 'react';
import { useSelector } from 'react-redux';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { DiscountType } from '@metamask/bridge-controller';
import {
  getBridgeQuotes,
  BridgeAppState,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { JustifyContent } from '../../../helpers/constants/design-system';
import { Row } from '../layout';
import { RewardsDiscountBadge } from '../../../components/app/rewards/RewardsDiscountBadge';
import { RewardsVipBadge } from '../../../components/app/rewards/RewardsVipBadge';
import { readMmFee } from '../utils/quote';

export const BridgeDiscountFeeMessage = () => {
  const t = useI18nContext();

  const { activeQuote } = useSelector(getBridgeQuotes);

  const { isQuoteExpired } = useSelector((state) =>
    getValidationErrors(state as BridgeAppState, Date.now()),
  );

  if (!activeQuote) {
    return null;
  }

  if (isQuoteExpired) {
    return null;
  }

  const { isDiscounted, baseFeePercentage, quoteFeePercentage, discountType } =
    readMmFee(activeQuote);

  if (!isDiscounted) {
    return null;
  }

  return (
    <Row gap={1} justifyContent={JustifyContent.center}>
      {discountType === DiscountType.VIP ? <RewardsVipBadge /> : null}
      {discountType && discountType !== DiscountType.VIP ? (
        <RewardsDiscountBadge
          label={
            discountType === DiscountType.DAO
              ? t('bridgeDiscountBadgeDao')
              : t('bridgeDiscountBadgePromo')
          }
        />
      ) : null}
      <Text
        variant={TextVariant.BodyXs}
        color={TextColor.TextAlternative}
        style={{ textDecoration: 'line-through' }}
      >
        {t('percent', [baseFeePercentage])}
      </Text>
      <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
        {t('mmFee', [quoteFeePercentage])}
      </Text>
    </Row>
  );
};
