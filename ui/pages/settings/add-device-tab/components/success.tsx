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
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type SuccessProps = {
  onDone: () => void;
};

const Success = ({ onDone }: SuccessProps) => {
  const t = useI18nContext();

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="flex-1">
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={4}
        className="flex-1"
      >
        <Icon
          name={IconName.Confirmation}
          size={IconSize.Xl}
          color={IconColor.SuccessDefault}
        />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
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
            {t('add_device_success_desc', [5, 2])}
          </Text>
        </Box>
      </Box>
      <Button className="w-full mt-10" onClick={onDone}>
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
