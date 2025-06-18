import React from 'react';
import { Box, BoxProps, Text, TextProps } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  FontWeight,
  TextColor,
  TextTransform,
  TextVariant,
} from '../../../helpers/constants/design-system';

const Divider = React.forwardRef(
  ({
    text,
    textProps,
    ...props
  }: { text?: string; textProps?: TextProps<'p'> } & BoxProps<'div'>) => {
    const t = useI18nContext();
    const dividerText = text === undefined ? t('or') : text;
    return (
      <Box alignItems={AlignItems.center} className="or-divider" {...props}>
        {dividerText && (
          <Text
            width={BlockSize.Min}
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.textMuted}
            backgroundColor={BackgroundColor.backgroundDefault}
            paddingInline={2}
            marginInline="auto"
            textTransform={TextTransform.Uppercase}
            as="div"
            style={{
              position: 'relative',
              zIndex: 1,
            }}
            {...textProps}
          >
            {dividerText}
          </Text>
        )}
      </Box>
    );
  },
);

export default Divider;
