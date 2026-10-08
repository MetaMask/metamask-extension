import React from 'react';
import { Box } from '../../components/component-library/box/box';
import { Container } from '../../components/component-library/container/container';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextAlign,
} from '../../helpers/constants/design-system';

type DeepLinkCardProps = {
  children: React.ReactNode;
};

/**
 * Centered deep-link card. Width follows the screen up to the fullscreen size.
 * @param options0
 * @param options0.children
 */
export const DeepLinkCard = ({ children }: DeepLinkCardProps) => {
  return (
    <Container
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      data-testid="parent-selector-deep-link-page"
      style={{
        marginTop: '111px',
        width: '100%',
        boxSizing: 'border-box',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderMuted}
        borderRadius={BorderRadius.MD}
        data-testid="deep-link-card"
        style={{
          width: '100%',
          maxWidth: '446px',
          minHeight: '592px',
          boxSizing: 'border-box',
        }}
        paddingLeft={6}
        paddingRight={6}
        paddingTop={12}
        paddingBottom={8}
        borderWidth={1}
      >
        {children}
      </Box>
    </Container>
  );
};
