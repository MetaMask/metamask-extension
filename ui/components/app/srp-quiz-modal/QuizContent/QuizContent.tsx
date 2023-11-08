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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Button, Box, Text } from '../../../component-library';
import { IQuizInformationProps } from '../types';

export default function QuizContent({
  icon,
  image,
  content,
  moreContent,
  buttons,
}: IQuizInformationProps) {
  const t = useI18nContext();

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
      {image && (
        <Box display={Display.Flex} margin="auto" textAlign={TextAlign.Center}>
          <img
            src={image}
            alt={t('srpSecurityQuizImgAlt')}
            width="300"
            style={{ maxWidth: '100%' }} // should probably be in a className instead
          />
        </Box>
      )}
      <Text
        variant={TextVariant.bodyLgMedium}
        textAlign={TextAlign.Center}
        color={icon?.props.color} // Inherit this text color from the icon's color
      >
        {content}
      </Text>
      {moreContent && (
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
          {moreContent}
        </Text>
      )}
      {buttons.map((btn, idx) => (
        <Button
          key={idx}
          size={btn.size}
          onClick={btn.onClick}
          variant={btn.variant as any}
          width={BlockSize.Full}
          data-testid={btn['data-testid']}
        >
          {btn.label}
        </Button>
      ))}
    </>
  );
}
