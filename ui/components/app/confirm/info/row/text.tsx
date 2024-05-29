import React, { useContext } from 'react';
import { I18nContext } from '../../../../../contexts/i18n';
import {
  AlignItems,
  Display,
  FlexWrap,
  IconColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { Box, ButtonIcon, IconName, Text } from '../../../../component-library';

export type ConfirmInfoRowTextProps = {
  text: string;
  onEditCallback?: () => void;
};

export const ConfirmInfoRowText = ({
  text,
  onEditCallback,
}: ConfirmInfoRowTextProps) => {
  const t = useContext(I18nContext);

  const isEditable = Boolean(onEditCallback);

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={2}
    >
      <Text color={TextColor.inherit} style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </Text>
      {isEditable ? (
        <ButtonIcon
          color={IconColor.primaryDefault}
          ariaLabel={t('edit')} // Note required aria label prop for accessibility for screen readers
          marginLeft={4}
          iconName={IconName.Edit}
          onClick={onEditCallback}
        />
      ) : null}
    </Box>
  );
};
