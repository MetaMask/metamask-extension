import React from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  Display,
  FlexWrap,
  IconColor,
  TextColor,
} from '../../../../../helpers/constants/design-system';

export type ConfirmInfoRowTextProps = {
  text: string;
  onEditCallback?: () => void;
};

export const ConfirmInfoRowText = ({
  text,
  onEditCallback,
}: ConfirmInfoRowTextProps) => {
  const isEditable = !!onEditCallback;

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
        <Icon
          color={IconColor.primaryDefault}
          marginLeft={4}
          name={IconName.Edit}
          onClick={onEditCallback}
          size={IconSize.Sm}
        />
      ) : null}
    </Box>
  );
};
