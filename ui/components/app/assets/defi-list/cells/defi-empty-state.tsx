import React from 'react';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../../component-library';
import {
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
  TextColor,
  TextVariant,
  TextAlign,
} from '../../../../../helpers/constants/design-system';
import { getPortfolioUrl } from '../../../../../helpers/utils/portfolio';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function DeFiEmptyStateMessage({
  primaryText,
  secondaryText,
}: {
  primaryText: string;
  secondaryText: string;
}) {
  return (
    <Box
      paddingTop={6}
      marginTop={12}
      marginBottom={12}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      className="nfts-tab__link"
    >
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
        textAlign={TextAlign.Center}
        data-testid="defi-tab-no-positions"
      >
        {primaryText}
      </Text>
      {
        <ButtonLink
          size={ButtonLinkSize.Md}
          href={getPortfolioUrl('stake', 'ext_stake_button')}
          externalLink
          data-testid="defi-tab-start-earning-link"
        >
          {secondaryText}
        </ButtonLink>
      }
    </Box>
  );
}
