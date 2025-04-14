// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
