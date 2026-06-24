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
  syncedAccountCount: number;
  syncedWalletCount: number;
};

const Success = ({
  onDone,
  syncedAccountCount,
  syncedWalletCount,
}: SuccessProps) => {
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
          {t('add_device_success_desc', [
            syncedAccountCount,
            syncedWalletCount,
          ])}
        </Text>
      </Box>
      <Button className="w-full mt-10" onClick={onDone}>
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
