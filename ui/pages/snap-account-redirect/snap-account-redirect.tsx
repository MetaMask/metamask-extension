import React from 'react';
import { Box } from '../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderStyle,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { SnapAccountRedirectContent } from './components';

export interface SnapAccountRedirectProps {
  url: string;
  snapName: string;
  isBlockedUrl: boolean;
  message: string;
}

const SnapAccountRedirect = ({
  url,
  snapName,
  isBlockedUrl,
  message,
}: SnapAccountRedirectProps) => {
  return (
    <Box
      className="create-snap-account-page"
      height={BlockSize.Full}
      width={BlockSize.Full}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      paddingLeft={4}
      paddingRight={4}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        height={BlockSize.Full}
      >
        <SnapAccountRedirectContent
          url={url}
          snapName={snapName}
          isBlockedUrl={isBlockedUrl}
          message={message}
        />
      </Box>
    </Box>
  );
};

export default SnapAccountRedirect;
