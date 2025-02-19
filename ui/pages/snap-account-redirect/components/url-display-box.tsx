import React from 'react';
import type { SnapAccountRedirectProps } from '../snap-account-redirect';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  BorderColor,
  Display,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../../components/component-library';
import RedirectUrlIcon from './redirect-url-icon';

const UrlDisplayBox = ({
  url,
  onSubmit,
}: Pick<SnapAccountRedirectProps, 'url' | 'onSubmit'>) => {
  return (
    <Box
      display={Display.InlineFlex}
      backgroundColor={BackgroundColor.backgroundDefault}
      alignItems={AlignItems.center}
      borderWidth={1}
      borderRadius={BorderRadius.SM}
      borderColor={BorderColor.borderDefault}
      paddingRight={4}
    >
      <Text
        data-testid="snap-account-redirect-url-display-box"
        padding={2}
        variant={TextVariant.bodyMd}
        color={TextColor.primaryDefault}
      >
        {url}
      </Text>
      <RedirectUrlIcon url={url} onSubmit={onSubmit} />
    </Box>
  );
};

export default React.memo(UrlDisplayBox);
