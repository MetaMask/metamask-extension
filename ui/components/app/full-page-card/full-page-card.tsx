import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';

type FullPageCardProps = {
  children: React.ReactNode;
  pageTestId?: string;
  cardTestId?: string;
};

/**
 * Centered, bordered card used by fullscreen interstitial and error pages
 * such as the deep-link interstitial and the page-not-found screen.
 *
 * @param props - Component props
 * @param props.children - Card content
 * @param props.pageTestId - Test id for the outer page wrapper
 * @param props.cardTestId - Test id for the card itself
 */
export const FullPageCard = ({
  children,
  pageTestId,
  cardTestId,
}: FullPageCardProps) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    alignItems={BoxAlignItems.Center}
    paddingHorizontal={4}
    className="box-border w-full pt-28"
    data-testid={pageTestId}
  >
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      borderColor={BoxBorderColor.BorderMuted}
      borderWidth={1}
      paddingHorizontal={6}
      paddingTop={12}
      paddingBottom={8}
      className="box-border min-h-96 w-full max-w-md rounded-md text-center"
      data-testid={cardTestId}
    >
      {children}
    </Box>
  </Box>
);
