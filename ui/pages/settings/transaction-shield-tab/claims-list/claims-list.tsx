import React from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Tag,
  Text,
} from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextTransform,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const CLAIM_STATUS = {
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

type ClaimStatus = (typeof CLAIM_STATUS)[keyof typeof CLAIM_STATUS];

const ClaimsList = () => {
  const t = useI18nContext();

  const claimItem = (id: string, label: string, status?: ClaimStatus) => {
    return (
      <Box
        as="button"
        data-testid={`claim-item-${id}`}
        display={Display.Flex}
        backgroundColor={BackgroundColor.backgroundSection}
        padding={4}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        borderRadius={BorderRadius.LG}
        onClick={() => {}}
      >
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
          <Text variant={TextVariant.bodyMdMedium}>{label}</Text>
          {status && (
            <Tag
              borderStyle={BorderStyle.none}
              borderRadius={BorderRadius.SM}
              label={
                status === CLAIM_STATUS.COMPLETED
                  ? t('completed')
                  : t('rejected')
              }
              backgroundColor={
                status === CLAIM_STATUS.COMPLETED
                  ? BackgroundColor.successMuted
                  : BackgroundColor.errorMuted
              }
              labelProps={{
                color:
                  status === CLAIM_STATUS.COMPLETED
                    ? TextColor.successDefault
                    : TextColor.errorDefault,
              }}
            />
          )}
        </Box>

        <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textAlternativeSoft}
          >
            {t('viewDetails')}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Md}
            color={IconColor.iconAlternativeSoft}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Box
      className="claims-list-page"
      data-testid="claims-list-page"
      width={BlockSize.Full}
    >
      <Box paddingTop={4} paddingLeft={4} paddingRight={4} paddingBottom={0}>
        <Text
          marginBottom={2}
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          textTransform={TextTransform.Uppercase}
        >
          {t('shieldClaimsPendingTitle')}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {claimItem('3', 'Claims #0003')}
          {claimItem('4', 'Claims #0004')}
        </Box>
      </Box>
      <Box paddingTop={4} paddingLeft={4} paddingRight={4} paddingBottom={0}>
        <Text
          marginBottom={2}
          variant={TextVariant.bodyMd}
          color={TextColor.textAlternative}
          textTransform={TextTransform.Uppercase}
        >
          {t('shieldClaimsHistoryTitle')}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {claimItem('1', 'Claims #0001', CLAIM_STATUS.COMPLETED)}
          {claimItem('2', 'Claims #0002', CLAIM_STATUS.REJECTED)}
        </Box>
      </Box>
    </Box>
  );
};

export default ClaimsList;
