import React from 'react';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Box, Text } from '../../../../../../components/component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
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
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.flexStart}
        padding={2}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
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
            borderRadius={BorderRadius.LG}
            display={Display.InlineFlex}
            alignItems={AlignItems.center}
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
