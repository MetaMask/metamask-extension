import React from 'react';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { BUTTON_SIZES, Button, Text } from '../../../component-library';
import Box from '../../../ui/box';
import { IQuizInformationProps } from '../types';

export default function QuizContent({
  icon,
  image,
  content,
  moreContent,
  buttons,
}: IQuizInformationProps) {
  return (
    <>
      {icon && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          {icon}
        </Box>
      )}
      {image && <img src={image} width="100%" />}
      <Text
        variant={TextVariant.bodyLgMedium}
        textAlign={TextAlign.Center}
        margin={2}
        color={icon?.props.color} // Inherit this text color from the icon's color
      >
        {content}
      </Text>
      {moreContent && (
        <Text
          variant={TextVariant.bodyMdBold}
          textAlign={TextAlign.Center}
          margin={4}
        >
          {moreContent}
        </Text>
      )}
      {buttons.map((btn, idx) => (
        <Button
          key={idx}
          size={BUTTON_SIZES.LG}
          onClick={btn.onClick}
          label={btn.label}
          variant={btn.variant}
          marginBottom={2}
          width={BlockSize.Full}
        >
          {btn.label}
        </Button>
      ))}
    </>
  );
}
