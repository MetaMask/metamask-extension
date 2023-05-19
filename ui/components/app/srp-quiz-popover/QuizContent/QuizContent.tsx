import React from 'react';
import {
  AlignItems,
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
      {image && <img src={image} />}
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
          marginLeft={4}
          marginRight={4}
          marginBottom={2}
        >
          {btn.label}
        </Button>
      ))}
    </>
  );
}
