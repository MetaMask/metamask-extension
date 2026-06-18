import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  BlockSize,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Button, Text } from '../../../component-library';
import { IQuizInformationProps } from '../types';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
          className="flex flex-row"
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
        >
          {icon}
        </Box>
      )}
      {image && (
        <Box className="flex text-center m-auto">
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
