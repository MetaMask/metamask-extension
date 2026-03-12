import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import {
  ProductPrice,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { getProductPrice } from '../../../../../shield-plan/utils';
import { SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS } from '../../../../../../../shared/constants/subscriptions';

export const SubscriptionDetails = ({
  showTrial,
  productPrice,
}: {
  showTrial: boolean;
  productPrice?: ProductPrice;
}) => {
  const t = useI18nContext();

  const isYearlySubscription =
    productPrice?.interval === RECURRING_INTERVALS.year;

  let planDetailsStr = '';
  if (productPrice) {
    const price = getProductPrice(productPrice);
    if (isYearlySubscription) {
      planDetailsStr = `$${price}/${t('year')} (${t('annual')})`;
    } else {
      planDetailsStr = `$${price}/${t('month')} (${t('monthly')})`;
    }
  }

  return (
    <ConfirmInfoSection data-testid="shield-subscription-approve__subscription_details_section">
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Start}
        padding={2}
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Start}
        >
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold} color={TextColor.TextDefault}>
            {t('transactionShield')}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {planDetailsStr}
          </Text>
        </Box>
        {showTrial && (
          <Box
            data-testid="free-seven-day-trial"
            className="rounded-lg"
            alignItems={BoxAlignItems.Center}
            paddingLeft={2}
            paddingRight={2}
            style={{
              color: 'var(--color-primary-default)',
              backgroundColor: 'var(--color-primary-muted-hover)',
            }}
          >
            <Text variant={TextVariant.BodySm} color={TextColor.Inherit}>
              {t('freeTrialDays', [
                productPrice?.trialPeriodDays ??
                  SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS,
              ])}
            </Text>
          </Box>
        )}
      </Box>
    </ConfirmInfoSection>
  );
};
