import React from 'react';
import {
  Box,
  Button,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type SuccessProps = {
  onDone: () => void;
  accountCount?: number;
  srpCount?: number;
};

const getSuccessDescription = (
  t: ReturnType<typeof useI18nContext>,
  accountCount: number,
  srpCount: number,
): string => {
  // A single account always belongs to a single SRP, so there is no
  // "1 account from N Secret Recovery Phrases" case to handle.
  if (accountCount === 1) {
    return t('add_device_success_desc_singular_account_singular_srp');
  }
  if (srpCount === 1) {
    return t('add_device_success_desc_plural_account_singular_srp', [
      accountCount,
    ]);
  }
  return t('add_device_success_desc', [accountCount, srpCount]);
};

const Success = ({ onDone, accountCount = 5, srpCount = 2 }: SuccessProps) => {
  const t = useI18nContext();

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      gap={8}
      paddingTop={8}
      className="flex-1"
    >
      <Box
        className="text-center"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Icon
          name={IconName.Confirmation}
          size={IconSize.Xl}
          color={IconColor.SuccessDefault}
          className="mx-auto"
        />
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
        >
          {t('add_device_success_title')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          textAlign={TextAlign.Center}
        >
          {getSuccessDescription(t, accountCount, srpCount)}
        </Text>
      </Box>
      <Button className="w-full mt-10" onClick={onDone}>
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
