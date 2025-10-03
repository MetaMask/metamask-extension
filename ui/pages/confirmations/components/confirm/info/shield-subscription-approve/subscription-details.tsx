import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Text } from '../../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

export const SubscriptionDetails = ({
  approvalAmount,
  showTrial,
}: {
  approvalAmount: string;
  showTrial: boolean;
}) => {
  const t = useI18nContext();

  const isMonthlySubscription = approvalAmount === '96';

  const planDetailsStr = isMonthlySubscription
    ? `$8/${t('month')} (${t('monthly')})`
    : `$80/${t('year')} (${t('annual')})`;

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
          <Text variant={TextVariant.bodyMdBold} color={TextColor.textDefault}>
            {t('transactionShield')}
          </Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
            {planDetailsStr}
          </Text>
        </Box>
        {showTrial && (
          <Box
            data-testid="free-seven-day-trial"
            // borderRadius={BorderRadius.LG}
            // display={Display.InlineFlex}
            alignItems={BoxAlignItems.Center}
            paddingLeft={1}
            paddingRight={1}
            style={{
              color: 'var(--color-primary-default)',
              backgroundColor: 'var(--color-primary-muted-hover)',
            }}
          >
            <Text variant={TextVariant.bodySm} color={TextColor.inherit}>
              {t('freeSevenDayTrial')}
            </Text>
          </Box>
        )}
      </Box>
    </ConfirmInfoSection>
  );
};
