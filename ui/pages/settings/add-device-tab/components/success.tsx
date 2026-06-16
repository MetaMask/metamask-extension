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
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type SuccessProps = {
  onDone: () => void;
};

const Success = ({ onDone }: SuccessProps) => {
  const t = useI18nContext();

  return (
    <Box className="p-4 flex flex-1 flex-col">
      <Box className="flex flex-1 flex-col items-center justify-center gap-4">
        <Icon
          name={IconName.Confirmation}
          size={IconSize.Xl}
          color={IconColor.SuccessDefault}
        />
        <Box className="flex flex-col items-center gap-1">
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
      <Button className="w-full mt-auto" onClick={onDone}>
        {t('done')}
      </Button>
    </Box>
  );
};

export default Success;
