import React from 'react';
import { useSelector } from 'react-redux';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import {
  getBridgeQuotes,
  BridgeAppState,
  getValidationErrors,
  getFromAccount,
  getFromChain,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { JustifyContent } from '../../../helpers/constants/design-system';
import { Row } from '../layout';
import { RewardsVipBadge } from '../../../components/app/rewards/RewardsVipBadge';
import { formatAccountToCaipAccountId } from '../../../helpers/utils/rewards-utils';
import { isDiscountedMMFee } from '../utils/quote';

export const BridgeVipFeeMessage = () => {
  const t = useI18nContext();

  const { activeQuote } = useSelector(getBridgeQuotes);
  const fromAccount = useSelector(getFromAccount);
  const fromChain = useSelector(getFromChain);

  const { isQuoteExpired } = useSelector((state) =>
    getValidationErrors(state as BridgeAppState, Date.now()),
  );

  if (!activeQuote) {
    return null;
  }

  if (isQuoteExpired) {
    return null;
  }

  const caipAccountId = formatAccountToCaipAccountId(
    fromAccount?.address,
    fromChain?.chainId,
  );
  if (!caipAccountId) {
    return null;
  }

  const { isDiscounted, baseFeePercentage, quoteFeePercentage } =
    isDiscountedMMFee(activeQuote);

  if (!isDiscounted) {
    return null;
  }

  // Render VIP tag and fees
  return (
    <Row gap={1} justifyContent={JustifyContent.center}>
      <RewardsVipBadge accountId={caipAccountId} />
      <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
        {t('includes')}
      </Text>
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
